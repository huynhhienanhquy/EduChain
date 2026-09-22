import { Router } from 'express';
import {
  addLesson,
  createCourse,
  createOrUpdateTest,
  getCourseById,
  getCourses,
  getLearningCourse,
  getLessonsByCourse,
  getMyCourses,
  getResultsByCourse,
  getStudentsByCourse,
  updateLesson,
  deleteLesson,
} from '../controllers/course.controller.js';
import { authorize, optionalAuth, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, getCourses);
router.get('/my-courses', protect, authorize('student'), getMyCourses);
router.get('/:id', optionalAuth,getCourseById);
router.get('/:id/learn', protect, authorize('student'), getLearningCourse);
router.get('/:id/students', protect, authorize('admin'), getStudentsByCourse);
router.get('/:id/results', protect, authorize('admin'), getResultsByCourse);
router.get('/:id/lessons', protect, authorize('admin'), getLessonsByCourse);


router.post('/', protect, authorize('admin'), createCourse);
router.post('/:id/lessons', protect, authorize('admin'), addLesson);
router.post('/:id/test', protect, authorize('admin'), createOrUpdateTest);
router.put('/lessons/:lessonId', protect, authorize('admin'), updateLesson);
router.delete('/lessons/:lessonId', protect, authorize('admin'), deleteLesson);

export default router;