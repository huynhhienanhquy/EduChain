import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getAddress, verifyMessage } from 'ethers';
import { User } from '../models/index.js';
import { generateToken } from '../utils/generateToken.js';
import { isValidWalletAddress, normalizeEmail, safeUser } from '../utils/response.js';

export async function register(req, res) {
  const fullName = String(req.body.fullName || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const role = req.body.role === 'admin' ? 'admin' : 'student';

  if (role === 'admin' && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Admin registration is disabled in production' });
  }

  if (!fullName || !email || password.length < 6) {
    return res.status(400).json({ message: 'Full name, email và mật khẩu tối thiểu 6 ký tự là bắt buộc' });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash, role });
  const token = generateToken(user);

  res.status(201).json({
    message: 'Register successful',
    data: {
      user: safeUser(user),
      token,
    },
  });
}

export async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({
    message: 'Login successful',
    data: {
      user: safeUser(user),
      token,
    },
  });
}

function walletMessage({ userId, walletAddress, nonce }) {
  return `EduChain wallet connection\nAccount: ${userId}\nWallet: ${walletAddress}\nNonce: ${nonce}`;
}

export async function walletChallenge(req, res) {
  const walletAddress = String(req.body.walletAddress || '').trim();
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({ message: 'Wallet address không hợp lệ' });
  }

  let normalizedAddress;
  try {
    normalizedAddress = getAddress(walletAddress);
  } catch {
    return res.status(400).json({ message: 'Invalid wallet address checksum' });
  }
  const nonce = randomBytes(16).toString('hex');
  const challengeToken = jwt.sign(
    { purpose: 'wallet-connect', userId: req.user.id, walletAddress: normalizedAddress, nonce },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  res.json({
    data: {
      message: walletMessage({ userId: req.user.id, walletAddress: normalizedAddress, nonce }),
      challengeToken,
    },
  });
}

export async function connectWallet(req, res) {
  const walletAddress = String(req.body.walletAddress || '').trim();
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({ message: 'Invalid wallet address' });
  }

  let normalizedAddress;
  try {
    normalizedAddress = getAddress(walletAddress);
  } catch {
    return res.status(400).json({ message: 'Invalid wallet address checksum' });
  }
  try {
    const challenge = jwt.verify(String(req.body.challengeToken || ''), process.env.JWT_SECRET);
    if (challenge.purpose !== 'wallet-connect' ||
        challenge.userId !== req.user.id ||
        challenge.walletAddress !== normalizedAddress) {
      return res.status(400).json({ message: 'Invalid wallet challenge' });
    }

    const message = walletMessage(challenge);
    if (getAddress(verifyMessage(message, String(req.body.signature || ''))) !== normalizedAddress) {
      return res.status(400).json({ message: 'Wallet signature does not match' });
    }
  } catch {
    return res.status(400).json({ message: 'Invalid or expired wallet signature' });
  }

  const existing = await User.findOne({ where: { walletAddress: normalizedAddress } });
  if (existing && existing.id !== req.user.id) {
    return res.status(400).json({ message: 'Ví này đã được liên kết với tài khoản khác' });
  }

  req.user.walletAddress = normalizedAddress;
  await req.user.save();
  res.json({ message: 'Wallet connected', data: safeUser(req.user) });
}

export async function profile(req, res) {
  res.json({ data: safeUser(req.user) });
}
export async function updateProfile(req, res) {
  try {
    const fullName = String(req.body.fullName || '').trim();

    if (!fullName) {
      return res.status(400).json({
        message: 'Họ tên không được để trống',
      });
    }

    req.user.fullName = fullName;
    await req.user.save();

    return res.json({
      message: 'Cập nhật profile thành công',
      data: safeUser(req.user),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || 'Cập nhật profile thất bại',
    });
  }
}

export async function changePassword(req, res) {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Xác nhận mật khẩu không khớp',
      });
    }

    const matched = await bcrypt.compare(currentPassword, req.user.passwordHash);

    if (!matched) {
      return res.status(400).json({
        message: 'Mật khẩu hiện tại không đúng',
      });
    }

    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();

    return res.json({
      message: 'Đổi mật khẩu thành công',
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || 'Đổi mật khẩu thất bại',
    });
  }
}
