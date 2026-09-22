import { Router } from 'express';
import {
  changePassword,
  connectWallet,
  login,
  profile,
  register,
  updateProfile,
  walletChallenge,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, profile);
router.put('/me', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/wallet-challenge', protect, walletChallenge);
router.post('/connect-wallet', protect, connectWallet);

export default router;
