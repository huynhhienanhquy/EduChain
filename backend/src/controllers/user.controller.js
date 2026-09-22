import { User } from '../models/index.js';

export async function searchUserByEmail(req, res) {
  try {
    const { email } = req.query;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Thiếu email sinh viên' });
    }

    const user = await User.findOne({
      where: {
        email: email.trim(),
        role: 'student',
      },
      attributes: ['id', 'fullName', 'email', 'walletAddress', 'role'],
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
    }

    return res.json({ data: user });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tìm sinh viên',
      error: error.message,
    });
  }
}

export async function getAllStudents(req, res) {
  try {
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'fullName', 'email', 'walletAddress', 'role'],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ data: students });
  } catch (error) {
    return res.status(500).json({
      message: 'Không lấy được danh sách sinh viên',
      error: error.message,
    });
  }
}