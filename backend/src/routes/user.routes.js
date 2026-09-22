import { Router } from 'express';
import { searchUserByEmail, getAllStudents } from '../controllers/user.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/search', protect, authorize('admin'), searchUserByEmail);
router.get('/students', protect, authorize('admin'), getAllStudents);

export default router;