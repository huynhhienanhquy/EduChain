import { Test, TestQuestion, TestResult, Enrollment } from '../models/index.js';

// ================= VALIDATE TEST =================
function validateTestPayload({ title, passScore, questions }) {
  if (!title || !String(title).trim()) {
    return 'Tên bài test không được để trống';
  }

  const score = Number(passScore);
  if (Number.isNaN(score) || score < 0 || score > 100) {
    return 'Điểm đạt phải nằm trong khoảng 0 - 100';
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return 'Phải có ít nhất 1 câu hỏi';
  }

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];

    if (!q.questionText || !String(q.questionText).trim()) {
      return `Câu hỏi ${i + 1} chưa nhập nội dung`;
    }

    if (!q.optionA || !String(q.optionA).trim()) {
      return `Câu hỏi ${i + 1} chưa nhập đáp án A`;
    }

    if (!q.optionB || !String(q.optionB).trim()) {
      return `Câu hỏi ${i + 1} chưa nhập đáp án B`;
    }

    if (!q.optionC || !String(q.optionC).trim()) {
      return `Câu hỏi ${i + 1} chưa nhập đáp án C`;
    }

    if (!q.optionD || !String(q.optionD).trim()) {
      return `Câu hỏi ${i + 1} chưa nhập đáp án D`;
    }

    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
      return `Câu hỏi ${i + 1} có đáp án đúng không hợp lệ`;
    }
  }

  return '';
}

function buildQuestionPayload(testId, questions) {
  return questions.map((q) => ({
    testId,
    questionText: String(q.questionText).trim(),
    optionA: String(q.optionA).trim(),
    optionB: String(q.optionB).trim(),
    optionC: String(q.optionC).trim(),
    optionD: String(q.optionD).trim(),
    correctAnswer: q.correctAnswer,
  }));
}

// ================= GET TESTS BY COURSE =================
export async function getTestsByCourse(req, res) {
  try {
    const { courseId } = req.params;

    const tests = await Test.findAll({
      where: { courseId },
      include: [
        {
          model: TestQuestion,
          as: 'questions',
        },
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: TestQuestion, as: 'questions' }, 'id', 'ASC'],
      ],
    });

    return res.json({
      data: tests,
    });
  } catch (err) {
    console.error('GET TESTS ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Không tải được danh sách bài test',
    });
  }
}

// ================= CREATE TEST =================
export async function createTest(req, res) {
  try {
    const { courseId } = req.params;
    const { title, passScore, questions } = req.body;

    const validationError = validateTestPayload({ title, passScore, questions });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const test = await Test.create({
      courseId,
      title: String(title).trim(),
      passScore: Number(passScore),
    });

    await TestQuestion.bulkCreate(buildQuestionPayload(test.id, questions));

    const fullTest = await Test.findByPk(test.id, {
      include: [
        {
          model: TestQuestion,
          as: 'questions',
        },
      ],
    });

    return res.status(201).json({
      message: 'Tạo bài test thành công',
      data: fullTest,
    });
  } catch (err) {
    console.error('CREATE TEST ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Tạo test thất bại',
    });
  }
}

// ================= UPDATE TEST =================
export async function updateTest(req, res) {
  try {
    const { testId } = req.params;
    const { title, passScore, questions } = req.body;

    const validationError = validateTestPayload({ title, passScore, questions });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const test = await Test.findByPk(testId);

    if (!test) {
      return res.status(404).json({
        message: 'Không tìm thấy bài test',
      });
    }

    test.title = String(title).trim();
    test.passScore = Number(passScore);
    await test.save();

    await TestQuestion.destroy({
      where: { testId: test.id },
    });

    await TestQuestion.bulkCreate(buildQuestionPayload(test.id, questions));

    const fullTest = await Test.findByPk(test.id, {
      include: [
        {
          model: TestQuestion,
          as: 'questions',
        },
      ],
    });

    return res.json({
      message: 'Cập nhật bài test thành công',
      data: fullTest,
    });
  } catch (err) {
    console.error('UPDATE TEST ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Cập nhật test thất bại',
    });
  }
}

// ================= DELETE TEST =================
export async function deleteTest(req, res) {
  try {
    const { testId } = req.params;

    const test = await Test.findByPk(testId);

    if (!test) {
      return res.status(404).json({
        message: 'Không tìm thấy bài test',
      });
    }

    await TestResult.destroy({
      where: { testId },
    });

    await TestQuestion.destroy({
      where: { testId },
    });

    await test.destroy();

    return res.json({
      message: 'Xóa bài test thành công',
    });
  } catch (err) {
    console.error('DELETE TEST ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Xóa test thất bại',
    });
  }
}

// ================= SUBMIT TEST =================
export async function submitTest(req, res) {
  try {
    const { testId } = req.params;
    const { answers } = req.body;
    const studentId = req.user.id;

    const test = await Test.findByPk(testId, {
      include: [
        {
          model: TestQuestion,
          as: 'questions',
        },
      ],
    });

    if (!test) {
      return res.status(404).json({ message: 'Không tìm thấy bài test' });
    }

    const enrollment = await Enrollment.findOne({
      where: {
        courseId: test.courseId,
        studentId,
      },
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Bạn chưa tham gia khóa học này' });
    }

    const questionList = test.questions || [];

    if (!questionList.length) {
      return res.status(400).json({ message: 'Bài test chưa có câu hỏi' });
    }

    let correctCount = 0;

    for (const question of questionList) {
      const studentAnswer = answers?.[question.id];

      if (studentAnswer === question.correctAnswer) {
        correctCount += 1;
      }
    }

    const score = Math.round((correctCount / questionList.length) * 100);
    const passed = score >= Number(test.passScore || 0);

    const existing = await TestResult.findOne({
      where: {
        testId,
        studentId,
      },
    });

    let result;

    if (existing) {
      existing.score = score;
      existing.passed = passed;
      await existing.save();
      result = existing;
    } else {
      result = await TestResult.create({
        testId,
        courseId: test.courseId,
        studentId,
        score,
        passed,
      });
    }

    return res.json({
      message: 'Nộp bài thành công',
      data: result,
    });
  } catch (err) {
    console.error('SUBMIT TEST ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Nộp bài thất bại',
    });
  }
}