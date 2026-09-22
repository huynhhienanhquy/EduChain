import { Enrollment, Course } from '../models/index.js';
import { isLikelyTxHash } from '../utils/response.js';

export async function buyCourse(req, res) {
  const courseId = Number(req.body.courseId);
  const paymentType = req.body.paymentType || 'eth';
  const txHash = String(req.body.txHash || '').trim();

  const course = await Course.findByPk(courseId);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const existing = await Enrollment.findOne({ where: { studentId: req.user.id, courseId } });
  if (existing) {
    return res.status(400).json({ message: 'You already bought this course' });
  }

  if (!req.user.walletAddress) {
    return res.status(400).json({ message: 'Bạn cần kết nối ví trước khi mua khóa học' });
  }

  if (!['eth', 'coin', 'free'].includes(paymentType)) {
    return res.status(400).json({ message: 'paymentType không hợp lệ' });
  }

  if (paymentType === 'eth' && !isLikelyTxHash(txHash)) {
    return res.status(400).json({ message: 'Thiếu txHash hợp lệ cho thanh toán MetaMask' });
  }

  const enrollment = await Enrollment.create({
    studentId: req.user.id,
    courseId,
    paymentType,
    txHash: txHash || null,
    status: 'active',
  });

  res.status(201).json({ message: 'Course purchased successfully', data: enrollment });
}
