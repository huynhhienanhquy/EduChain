import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken } from '../utils/generateToken.js';
import { isValidWalletAddress, normalizeEmail, safeUser } from '../utils/response.js';

export async function register(req, res) {
  const fullName = String(req.body.fullName || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const role = req.body.role === 'admin' ? 'admin' : 'student';

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

export async function connectWallet(req, res) {
  const walletAddress = String(req.body.walletAddress || '').trim();
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({ message: 'Wallet address không hợp lệ' });
  }

  const existing = await User.findOne({ where: { walletAddress } });
  if (existing && existing.id !== req.user.id) {
    return res.status(400).json({ message: 'Ví này đã được liên kết với tài khoản khác' });
  }

  req.user.walletAddress = walletAddress;
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
