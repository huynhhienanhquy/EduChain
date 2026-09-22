import { Router } from 'express';
import { buyCourse } from '../controllers/enrollment.controller.js';
import { authorize, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/buy-course', protect, authorize('student'), buyCourse);

export default router;
