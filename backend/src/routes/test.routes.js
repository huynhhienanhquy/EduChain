import { Router } from 'express';
import {
  createTest,
  deleteTest,
  getTestsByCourse,
  submitTest,
  updateTest,
} from '../controllers/test.controller.js';
import { authorize, protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Admin xem danh sách test của một khóa học
router.get('/course/:courseId', protect, authorize('admin'), getTestsByCourse);

// Admin tạo test mới cho một khóa học
router.post('/:courseId', protect, authorize('admin'), createTest);

// Admin sửa test cũ
router.put('/:testId', protect, authorize('admin'), updateTest);

// Admin xóa test
router.delete('/:testId', protect, authorize('admin'), deleteTest);

// Student nộp bài test
router.post('/:testId/submit', protect, authorize('student'), submitTest);

export default router;