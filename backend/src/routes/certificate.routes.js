import { Router } from 'express';
import {
  getMyCertificates,
  issueCertificate,
  verifyCertificateEligibility,
  verifyCertificatePublic,
} from '../controllers/certificate.controller.js';
import { authorize, protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Public verify - không cần đăng nhập
router.get('/verify-public', verifyCertificatePublic);

// Student xem chứng chỉ của mình
router.get('/my', protect, authorize('student'), getMyCertificates);

// Admin kiểm tra điều kiện trước khi mở MetaMask
router.post(
  '/verify-eligibility',
  protect,
  authorize('admin'),
  verifyCertificateEligibility
);

// Admin lưu chứng chỉ sau khi đã ghi on-chain thành công
router.post('/issue', protect, authorize('admin'), issueCertificate);

export default router;