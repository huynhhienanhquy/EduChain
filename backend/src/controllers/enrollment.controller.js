import { Enrollment, Course } from '../models/index.js';
import { isLikelyTxHash } from '../utils/response.js';
import { InvalidPaymentError, verifyCoursePayment } from '../utils/verifyCoursePayment.js';

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

  if (process.env.NODE_ENV === 'production' && paymentType !== 'eth') {
    return res.status(403).json({ message: 'Only verified on-chain payments are enabled in production' });
  }

  if (paymentType === 'eth' && !isLikelyTxHash(txHash)) {
    return res.status(400).json({ message: 'Thiếu txHash hợp lệ cho thanh toán MetaMask' });
  }

  if (paymentType === 'eth' && process.env.NODE_ENV === 'production') {
    const reusedPayment = await Enrollment.findOne({ where: { txHash } });
    if (reusedPayment) {
      return res.status(400).json({ message: 'This payment has already been used' });
    }
    try {
      await verifyCoursePayment({ txHash, walletAddress: req.user.walletAddress, course });
    } catch (error) {
      if (error instanceof InvalidPaymentError) {
        return res.status(400).json({ message: error.message });
      }
      console.error('Payment verification failed:', error);
      return res.status(502).json({ message: 'Unable to verify payment with the blockchain RPC' });
    }
  }

  let enrollment;
  try {
    enrollment = await Enrollment.create({
      studentId: req.user.id,
      courseId,
      paymentType,
      txHash: txHash || null,
      status: 'active',
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Course or payment was already used' });
    }
    throw error;
  }

  res.status(201).json({ message: 'Course purchased successfully', data: enrollment });
}
