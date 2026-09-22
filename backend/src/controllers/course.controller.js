import { Certificate, Course, Enrollment, Lesson, Test, TestQuestion, TestResult, User } from '../models/index.js';

function stripAnswers(test) {
  if (!test) return null;
  const testJson = test.toJSON ? test.toJSON() : test;
  return {
    ...testJson,
    questions: (testJson.questions || []).map(({ correctAnswer, ...question }) => question),
  };
}

// ================= CREATE COURSE =================
export async function createCourse(req, res) {
  const payload = {
    title: String(req.body.title || '').trim(),
    description: String(req.body.description || '').trim(),
    subject: String(req.body.subject || '').trim() || 'Chưa phân loại', // ✅ giữ từ file 2 :contentReference[oaicite:0]{index=0}
    price: Number(req.body.price || 0),
    coinRequired: Number(req.body.coinRequired || 0),
    thumbnail: String(req.body.thumbnail || '').trim() || null,
    onChainCourseId: String(req.body.onChainCourseId || '').trim() || null,
    createdBy: req.user.id,
  };

  if (!payload.title || !payload.description) {
    return res.status(400).json({ message: 'Tiêu đề và mô tả khóa học là bắt buộc' });
  }

  const course = await Course.create(payload);
  res.status(201).json({ message: 'Course created', data: course });
}

// ================= GET ALL COURSES =================
export async function getCourses(req, res) {
  const studentId = req.user?.role === 'student' ? req.user.id : null;

  const courses = await Course.findAll({
    include: [{ model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] }],
    order: [['createdAt', 'DESC']],
  });

  let enrolledCourseIds = [];
  if (studentId) {
    const enrollments = await Enrollment.findAll({
      where: { studentId },
      attributes: ['courseId'],
    });
    enrolledCourseIds = enrollments.map((item) => item.courseId);
  }

  const data = courses.map((course) => ({
    ...course.toJSON(),
    isOwned: enrolledCourseIds.includes(course.id),
  }));

  res.json({ data });
}

// ================= GET COURSE DETAIL =================
export async function getCourseById(req, res) {
  const courseId = req.params.id;
  const studentId = req.user?.role === 'student' ? req.user.id : null;

  const course = await Course.findByPk(courseId, {
    include: [
      { model: Lesson, as: 'lessons' },
      {
        model: Test,
        as: 'tests',
        include: [{ model: TestQuestion, as: 'questions' }],
      },
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
    ],
    order: [
      [{ model: Lesson, as: 'lessons' }, 'lessonOrder', 'ASC'],
      [{ model: Test, as: 'tests' }, 'createdAt', 'DESC'],
    ],
  });

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  let isOwned = false;

  if (studentId) {
    const enrollment = await Enrollment.findOne({
      where: {
        studentId,
        courseId,
      },
    });

    isOwned = Boolean(enrollment);
  }

  const data = course.toJSON();

  data.lessonCount = data.lessons?.length || 0;
  data.tests = (data.tests || []).map(stripAnswers);
  data.lessons = [];
  data.isOwned = isOwned;

  res.json({ data });
}

// ================= LEARNING COURSE =================
export async function getLearningCourse(req, res) {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;

    const enrollment = await Enrollment.findOne({
      where: {
        studentId,
        courseId,
      },
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Bạn chưa mua khóa học này' });
    }

    const course = await Course.findByPk(courseId, {
      include: [
        { model: Lesson, as: 'lessons' },
        {
          model: Test,
          as: 'tests',
          include: [{ model: TestQuestion, as: 'questions' }],
        },
        {
          model: Certificate,
          as: 'certificates',
          where: { studentId },
          required: false,
        },
      ],
      order: [
        [{ model: Lesson, as: 'lessons' }, 'lessonOrder', 'ASC'],
        [{ model: Test, as: 'tests' }, 'createdAt', 'DESC'],
      ],
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const courseJson = course.toJSON();
    const testIds = (courseJson.tests || []).map((test) => test.id);

    const testResults = testIds.length
      ? await TestResult.findAll({
          where: {
            studentId,
            testId: testIds,
          },
          order: [['updatedAt', 'DESC']],
        })
      : [];

    const resultByTestId = new Map();

    testResults.forEach((result) => {
      resultByTestId.set(Number(result.testId), result.toJSON());
    });

    const tests = (courseJson.tests || []).map((test) => {
      const result = resultByTestId.get(Number(test.id));

      return {
        ...test,
        questions: (test.questions || []).map(({ correctAnswer, ...question }) => question),
        myResult: result
          ? {
              id: result.id,
              score: result.score,
              passed: result.passed,
              submittedAt: result.updatedAt || result.createdAt,
            }
          : null,
      };
    });

   const passedResults = testResults.filter((result) => result.passed);
const latestResult = testResults[0] || null;

const passedTestIds = new Set(
  passedResults.map((result) => Number(result.testId))
);

const missingTests = tests
  .filter((test) => !passedTestIds.has(Number(test.id)))
  .map((test) => test.title);

const passedAllTests = tests.length > 0 && missingTests.length === 0;

const data = {
  ...courseJson,
  tests,
  progress: {
    isEnrolled: true,
    lastScore: latestResult?.score ?? null,
    passed: passedAllTests,
    passedTestCount: passedTestIds.size,
    totalTestCount: tests.length,
    missingTests,
    hasCertificate: Boolean(courseJson.certificates?.length),
  },
};

    return res.json({ data });
  } catch (err) {
    console.error('GET LEARNING COURSE ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Không tải được khóa học',
    });
  }
}
// ================= LESSON =================
// ================= ADD LESSON =================
export async function addLesson(req, res) {
  try {
    const { id } = req.params;
    const { title, content, videoUrl, lessonOrder } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        message: 'Tiêu đề bài giảng không được để trống',
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        message: 'Nội dung bài giảng không được để trống',
      });
    }

    const parsedOrder = Number(lessonOrder);

    if (Number.isNaN(parsedOrder) || parsedOrder <= 0) {
      return res.status(400).json({
        message: 'Thứ tự bài giảng phải là số lớn hơn 0',
      });
    }

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        message: 'Không tìm thấy khóa học',
      });
    }

    const lesson = await Lesson.create({
      courseId: id,
      title: String(title).trim(),
      content: String(content).trim(),
      videoUrl: String(videoUrl || '').trim() || null,
      lessonOrder: parsedOrder,
    });

    return res.status(201).json({
      message: 'Thêm bài giảng thành công',
      data: lesson,
    });
  } catch (err) {
    console.error('ADD LESSON ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Thêm bài giảng thất bại',
    });
  }
}
// ================= MY COURSES =================
export async function getMyCourses(req, res) {
  const enrollments = await Enrollment.findAll({
    where: { studentId: req.user.id },
    include: [
      {
        model: Course,
        as: 'course',
        include: [
          { model: Lesson, as: 'lessons' },
          { model: Test, as: 'tests' }, // ✅ nhiều test
        ],
      },
    ],
    order: [['enrolledAt', 'DESC']],
  });

  res.json({ data: enrollments });
}

// ================= STUDENTS =================
export async function getStudentsByCourse(req, res) {
  const enrollments = await Enrollment.findAll({
    where: { courseId: req.params.id },
    include: [
      { model: User, as: 'student', attributes: ['id', 'fullName', 'email', 'walletAddress'] },
      { model: Course, as: 'course', attributes: ['id', 'title'] },
    ],
    order: [['enrolledAt', 'DESC']],
  });

  res.json({ data: enrollments });
}

// ================= TEST =================
export async function createOrUpdateTest(req, res) {
  const { title, passScore, questions } = req.body;

  let test = await Test.findOne({ where: { courseId: req.params.id } });

  if (!test) {
    test = await Test.create({ courseId: req.params.id, title, passScore });
  } else {
    test.title = title;
    test.passScore = passScore;
    await test.save();
    await TestQuestion.destroy({ where: { testId: test.id } });
  }

  if (Array.isArray(questions)) {
    await Promise.all(
      questions.map((q) =>
        TestQuestion.create({
          testId: test.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
        })
      )
    );
  }

  const fullTest = await Test.findByPk(test.id, {
    include: [{ model: TestQuestion, as: 'questions' }],
  });

  res.json({ message: 'Test saved', data: fullTest });
}

// ================= RESULTS =================
export async function getResultsByCourse(req, res) {
  try {
    const courseId = req.params.id;

    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'fullName', 'email', 'walletAddress'],
        },
      ],
      order: [['enrolledAt', 'DESC']],
    });

    const tests = await Test.findAll({
      where: { courseId },
      attributes: ['id', 'title', 'passScore'],
      order: [['createdAt', 'DESC']],
    });

    if (!tests.length) {
      return res.json({ data: [] });
    }

    const testIds = tests.map((test) => test.id);

    const results = await TestResult.findAll({
      where: {
        testId: testIds,
      },
      order: [['updatedAt', 'DESC']],
    });

    const resultsByStudentId = new Map();

    for (const result of results) {
      const sid = Number(result.studentId);

      if (!resultsByStudentId.has(sid)) {
        resultsByStudentId.set(sid, []);
      }

      resultsByStudentId.get(sid).push(result);
    }

    const data = enrollments.map((enrollment) => {
      const student = enrollment.student;
      const studentResults = resultsByStudentId.get(Number(student.id)) || [];

      const passedTestIds = new Set(
        studentResults
          .filter((result) => result.passed)
          .map((result) => Number(result.testId))
      );

      const missingTests = tests
        .filter((test) => !passedTestIds.has(Number(test.id)))
        .map((test) => test.title);

      const passed = tests.length > 0 && missingTests.length === 0;

      const bestScore = studentResults.length
        ? Math.max(...studentResults.map((result) => Number(result.score || 0)))
        : null;

      return {
        student,
        score: bestScore,
        passed,
        totalTests: tests.length,
        passedTests: passedTestIds.size,
        missingTests,
      };
    });

    return res.json({ data });
  } catch (err) {
    console.error('GET COURSE RESULTS ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Không tải được kết quả khóa học',
    });
  }
}

// ================= GET LESSONS =================
export async function getLessonsByCourse(req, res) {
  try {
    const { id } = req.params;

    const lessons = await Lesson.findAll({
      where: { courseId: id },
      order: [['lessonOrder', 'ASC']],
    });

    return res.json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Không lấy được danh sách bài giảng',
      error: error.message,
    });
  }
}
// ================= UPDATE LESSON =================
export async function updateLesson(req, res) {
  try {
    const { lessonId } = req.params;
    const { title, content, videoUrl, lessonOrder } = req.body;

    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: 'Không tìm thấy bài giảng',
      });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        message: 'Tiêu đề bài giảng không được để trống',
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        message: 'Nội dung bài giảng không được để trống',
      });
    }

    const parsedOrder = Number(lessonOrder);

    if (Number.isNaN(parsedOrder) || parsedOrder <= 0) {
      return res.status(400).json({
        message: 'Thứ tự bài giảng phải là số lớn hơn 0',
      });
    }

    lesson.title = String(title).trim();
    lesson.content = String(content).trim();
    lesson.videoUrl = String(videoUrl || '').trim() || null;
    lesson.lessonOrder = parsedOrder;

    await lesson.save();

    return res.json({
      message: 'Cập nhật bài giảng thành công',
      data: lesson,
    });
  } catch (err) {
    console.error('UPDATE LESSON ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Cập nhật bài giảng thất bại',
    });
  }
}

// ================= DELETE LESSON =================
export async function deleteLesson(req, res) {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: 'Không tìm thấy bài giảng',
      });
    }

    await lesson.destroy();

    return res.json({
      message: 'Xóa bài giảng thành công',
    });
  } catch (err) {
    console.error('DELETE LESSON ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Xóa bài giảng thất bại',
    });
  }
}