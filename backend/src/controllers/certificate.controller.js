import { Op } from 'sequelize';
import { Certificate, Course, Enrollment, Test, TestResult, User } from '../models/index.js';

function code() {
  return `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function getPassStatus(studentId, courseId) {
  const tests = await Test.findAll({
    where: { courseId },
    attributes: ['id', 'title'],
  });

  if (!tests.length) {
    return {
      passed: false,
      message: 'Khóa học này chưa có bài test',
      totalTests: 0,
      passedTests: 0,
      missingTests: [],
    };
  }

  const testIds = tests.map((test) => test.id);

  const passedResults = await TestResult.findAll({
    where: {
      studentId,
      testId: testIds,
      passed: true,
    },
  });

  const passedTestIds = new Set(
    passedResults.map((result) => Number(result.testId))
  );

  const missingTests = tests.filter(
    (test) => !passedTestIds.has(Number(test.id))
  );

  return {
    passed: missingTests.length === 0,
    message:
      missingTests.length === 0
        ? 'Student đã hoàn thành tất cả bài test'
        : `Student chưa hoàn thành tất cả bài test. Còn thiếu: ${missingTests
            .map((test) => test.title)
            .join(', ')}`,
    totalTests: tests.length,
    passedTests: passedTestIds.size,
    missingTests: missingTests.map((test) => test.title),
  };
}

export async function verifyCertificateEligibility(req, res) {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        message: 'Thiếu studentId hoặc courseId',
      });
    }

    const enrollment = await Enrollment.findOne({
      where: { studentId, courseId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'fullName', 'email', 'walletAddress'],
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'onChainCourseId'],
        },
      ],
    });

    if (!enrollment) {
      return res.status(400).json({
        message: 'Student chưa mua khóa học này',
      });
    }

    if (!enrollment.student?.walletAddress) {
      return res.status(400).json({
        message: 'Student chưa kết nối ví MetaMask',
      });
    }

    if (!enrollment.course?.onChainCourseId) {
      return res.status(400).json({
        message: 'Khóa học chưa có onChainCourseId',
      });
    }

    const passStatus = await getPassStatus(studentId, courseId);

    if (!passStatus.passed) {
      return res.status(400).json({
        message: passStatus.message,
        data: passStatus,
      });
    }

    const existing = await Certificate.findOne({
      where: { studentId, courseId },
    });

    if (existing) {
      return res.status(400).json({
        message: 'Student đã được cấp chứng chỉ cho khóa học này',
      });
    }

    return res.json({
      message: 'Student đủ điều kiện cấp chứng chỉ',
      data: {
        eligible: true,
        student: enrollment.student,
        course: enrollment.course,
        totalTests: passStatus.totalTests,
        passedTests: passStatus.passedTests,
      },
    });
  } catch (err) {
    console.error('VERIFY CERTIFICATE ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Kiểm tra điều kiện cấp chứng chỉ thất bại',
    });
  }
}

export async function issueCertificate(req, res) {
  try {
    const { studentId, courseId, certificateHash, nftTokenId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        message: 'Thiếu studentId hoặc courseId',
      });
    }

    if (!certificateHash || !String(certificateHash).trim()) {
      return res.status(400).json({
        message: 'Thiếu certificateHash',
      });
    }

    const enrollment = await Enrollment.findOne({
      where: { studentId, courseId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'fullName', 'email', 'walletAddress'],
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'onChainCourseId'],
        },
      ],
    });

    if (!enrollment) {
      return res.status(400).json({
        message: 'Student chưa mua khóa học này',
      });
    }

    if (!enrollment.student?.walletAddress) {
      return res.status(400).json({
        message: 'Student chưa kết nối ví MetaMask',
      });
    }

    if (!enrollment.course?.onChainCourseId) {
      return res.status(400).json({
        message: 'Khóa học chưa có onChainCourseId',
      });
    }

    const passStatus = await getPassStatus(studentId, courseId);

    if (!passStatus.passed) {
      return res.status(400).json({
        message: passStatus.message,
        data: passStatus,
      });
    }

    const existing = await Certificate.findOne({
      where: { studentId, courseId },
    });

    if (existing) {
      return res.status(400).json({
        message: 'Certificate đã được cấp trước đó',
      });
    }

    const certificate = await Certificate.create({
      studentId,
      courseId,
      issuedBy: req.user.id,
      certificateCode: code(),
      certificateHash: String(certificateHash).trim(),
      nftTokenId: nftTokenId || null,
    });

    return res.status(201).json({
      message: 'Certificate issued',
      data: certificate,
    });
  } catch (err) {
    console.error('ISSUE CERTIFICATE ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Cấp chứng chỉ thất bại',
    });
  }
}

export async function getMyCertificates(req, res) {
  try {
    const certificates = await Certificate.findAll({
      where: { studentId: req.user.id },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'subject', 'onChainCourseId'],
        },
        {
          model: User,
          as: 'issuer',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
      order: [['issuedAt', 'DESC']],
    });

    return res.json({ data: certificates });
  } catch (err) {
    console.error('GET MY CERTIFICATES ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Không tải được chứng chỉ',
    });
  }
}

export async function verifyCertificatePublic(req, res) {
  try {
    const keyword = String(req.query.keyword || '').trim();

    if (!keyword) {
      return res.status(400).json({
        message: 'Vui lòng nhập mã chứng chỉ hoặc certificate hash',
      });
    }

    const certificate = await Certificate.findOne({
      where: {
        [Op.or]: [
          { certificateCode: keyword },
          { certificateHash: keyword },
        ],
      },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'description', 'subject', 'onChainCourseId'],
        },
        {
          model: User,
          as: 'student',
          attributes: ['id', 'fullName', 'email', 'walletAddress'],
        },
        {
          model: User,
          as: 'issuer',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    });

    if (!certificate) {
      return res.status(404).json({
        message: 'Không tìm thấy chứng chỉ',
        data: {
          valid: false,
        },
      });
    }

    return res.json({
      message: 'Chứng chỉ tồn tại trong hệ thống EduChain',
      data: {
        valid: true,
        certificate,
        blockchainCheck: {
          canCheckOnChain: Boolean(
            certificate.certificateHash &&
              certificate.student?.walletAddress &&
              certificate.course?.onChainCourseId
          ),
        },
      },
    });
  } catch (err) {
    console.error('VERIFY CERTIFICATE PUBLIC ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Xác minh chứng chỉ thất bại',
    });
  }
}