import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client.js';

export default function CourseLearningPage() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [answersByTest, setAnswersByTest] = useState({});
  const [submittingTestId, setSubmittingTestId] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const selectedTest = useMemo(() => {
    if (!course?.tests?.length || !selectedTestId) return null;
    return course.tests.find((test) => String(test.id) === String(selectedTestId));
  }, [course, selectedTestId]);

  const loadCourse = async () => {
    const res = await client.get(`/courses/${id}/learn`);
    const data = res.data.data;

    setCourse(data);

    if (!selectedTestId && data.tests?.length) {
      setSelectedTestId(data.tests[0].id);
    }

    return data;
  };

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError('');
        await loadCourse();
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được khóa học');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [id]);

  const updateAnswer = (testId, questionId, option) => {
    setAnswersByTest((prev) => ({
      ...prev,
      [testId]: {
        ...(prev[testId] || {}),
        [questionId]: option,
      },
    }));
  };

  const submitTest = async (testId) => {
    try {
      setSubmittingTestId(testId);
      setError('');
      setMessage('');

      const test = course?.tests?.find((item) => String(item.id) === String(testId));

      if (!test) {
        setError('Không tìm thấy bài test');
        return;
      }

      const answers = answersByTest[testId] || {};
      const questionCount = test.questions?.length || 0;
      const answeredCount = Object.keys(answers).length;

      if (answeredCount < questionCount) {
        setError(`Bạn cần trả lời đủ ${questionCount} câu hỏi trước khi nộp bài`);
        return;
      }

      const res = await client.post(`/tests/${testId}/submit`, { answers });
      const result = res.data.data;

      setMessage(
        `${test.title}: Điểm ${result.score}/100 · ${result.passed ? 'Đạt' : 'Chưa đạt'}`
      );

      setAnswersByTest((prev) => ({
        ...prev,
        [testId]: {},
      }));

      await loadCourse();
    } catch (err) {
      setError(err.response?.data?.message || 'Nộp bài thất bại');
    } finally {
      setSubmittingTestId(null);
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <h2>Đang tải khóa học...</h2>
        <p className="muted">Vui lòng chờ trong giây lát.</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="panel">
        <p className="error">{error || 'Không tải được khóa học'}</p>
      </div>
    );
  }

  return (
    <div className="learning-layout">
      <aside className="learning-sidebar panel">
        <span className="badge">Learning Space</span>

        <h2>{course.title}</h2>

        <p className="muted">
          {course.tests?.length || 0} bài test · {course.lessons?.length || 0} bài giảng
        </p>

        <div className="learning-progress-card">
          <p>
            Điểm gần nhất:{' '}
            <strong>{course.progress?.lastScore ?? 'Chưa có'}</strong>
          </p>

          <p>
            Test đã đạt:{' '}
            <strong>
              {course.progress?.passedTestCount || 0}/{course.progress?.totalTestCount || 0}
            </strong>
          </p>

          <p>
            Chứng chỉ:{' '}
            <strong>
              {course.progress?.hasCertificate ? 'Đã cấp' : 'Chưa cấp'}
            </strong>
          </p>
        </div>

        {course.tests?.length ? (
          <div className="test-nav-list">
            {course.tests.map((test) => {
              const hasDone = Boolean(test.myResult);
              const isActive = String(selectedTestId) === String(test.id);

              return (
                <button
                  key={test.id}
                  type="button"
                  className={`test-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTestId(test.id);
                    setMessage('');
                    setError('');
                  }}
                >
                  <span>{test.title}</span>

                  {hasDone ? (
                    <small className={test.myResult.passed ? 'success' : 'error'}>
                      {test.myResult.passed ? 'Đã đạt' : 'Chưa đạt'} · {test.myResult.score}/100
                    </small>
                  ) : (
                    <small className="muted">Chưa thi</small>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="muted">Khóa học chưa có bài test.</p>
        )}
      </aside>

      <main className="learning-main">
        <section className="panel">
          <h1>Học khóa: {course.title}</h1>

          <p>{course.description}</p>

          {course.progress?.passed && !course.progress?.hasCertificate && (
          <div className="card">
            <span className="badge success-badge">Đủ điều kiện</span>

            <h3>Bạn đã đủ điều kiện nhận chứng chỉ</h3>

            <p className="muted">
              Bạn đã hoàn thành và đạt tất cả bài test của khóa học. Chứng chỉ sẽ được Admin cấp
              sau khi kiểm tra và ký giao dịch blockchain.
            </p>
          </div>
        )}
        {!course.progress?.passed && !course.progress?.hasCertificate && (
  <div className="card">
    <span className="badge">Chưa đủ điều kiện</span>

    <h3>Bạn chưa đủ điều kiện nhận chứng chỉ</h3>

    <p className="muted">
      Bạn cần đạt tất cả bài test trong khóa học. Hiện tại bạn đã đạt{' '}
      <strong>
        {course.progress?.passedTestCount || 0}/{course.progress?.totalTestCount || 0}
      </strong>{' '}
      bài test.
    </p>

    {course.progress?.missingTests?.length ? (
      <p className="error">
        Còn thiếu: {course.progress.missingTests.join(', ')}
      </p>
    ) : null}
  </div>
)}

          {course.progress?.hasCertificate && (
            <div className="card">
              <span className="badge success-badge">Certificate issued</span>

              <h3>Chứng chỉ đã được cấp</h3>

              <p className="muted">
                Bạn có thể xem chứng chỉ của mình tại trang “Chứng chỉ”.
              </p>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Bài giảng</h2>

          {course.lessons?.length ? (
            course.lessons.map((lesson) => (
              <div key={lesson.id} className="lesson-card">
                <div>
                  <span className="badge">Bài {lesson.lessonOrder}</span>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.content}</p>
                </div>

                {lesson.videoUrl && (
                  <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                    Mở video
                  </a>
                )}
              </div>
            ))
          ) : (
            <p className="muted">Khóa học chưa có bài giảng.</p>
          )}
        </section>

        {selectedTest ? (
          <section className="panel">
            <div className="test-header">
              <div>
                <span className="badge">Final Test</span>
                <h2>{selectedTest.title}</h2>
                <p className="muted">
                  Điểm đạt: {selectedTest.passScore} · Số câu hỏi:{' '}
                  {selectedTest.questions?.length || 0}
                </p>
              </div>

              {selectedTest.myResult ? (
                <div className="test-result-box">
                  <span className={selectedTest.myResult.passed ? 'success' : 'error'}>
                    {selectedTest.myResult.passed ? 'Đã đạt' : 'Chưa đạt'}
                  </span>

                  <strong>{selectedTest.myResult.score}/100</strong>
                </div>
              ) : (
                <div className="test-result-box">
                  <span className="muted">Chưa thi</span>
                </div>
              )}
            </div>

            {selectedTest.myResult && (
              <div className="card">
                <p>
                  Bạn đã từng nộp bài test này với điểm:{' '}
                  <strong>{selectedTest.myResult.score}/100</strong>
                </p>

                <p className="muted">
                  Bạn vẫn có thể làm lại và nộp lại. Kết quả mới sẽ thay thế kết quả cũ.
                </p>
              </div>
            )}

            <div className="question-list">
              {selectedTest.questions?.map((question, index) => {
                const selectedAnswer = answersByTest[selectedTest.id]?.[question.id] || '';

                return (
                  <div key={question.id} className="question-card">
                    <h3>
                      Câu {index + 1}: {question.questionText}
                    </h3>

                    {['A', 'B', 'C', 'D'].map((option) => (
                      <label
                        key={option}
                        className={`answer-option ${
                          selectedAnswer === option ? 'selected' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`test-${selectedTest.id}-q-${question.id}`}
                          checked={selectedAnswer === option}
                          onChange={() =>
                            updateAnswer(selectedTest.id, question.id, option)
                          }
                        />

                        <span>
                          <strong>{option}.</strong> {question[`option${option}`]}
                        </span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="actions wrap">
              <button
                type="button"
                onClick={() => submitTest(selectedTest.id)}
                disabled={submittingTestId === selectedTest.id}
              >
                {submittingTestId === selectedTest.id
                  ? 'Đang nộp bài...'
                  : selectedTest.myResult
                    ? 'Nộp lại bài test'
                    : 'Nộp bài'}
              </button>

              {selectedTest.myResult && (
                <button
                  type="button"
                  className="button-link secondary"
                  onClick={() =>
                    setAnswersByTest((prev) => ({
                      ...prev,
                      [selectedTest.id]: {},
                    }))
                  }
                >
                  Làm lại từ đầu
                </button>
              )}
            </div>

            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}
          </section>
        ) : (
          <section className="panel">
            <p className="muted">Chọn một bài test ở bên trái để làm bài.</p>
          </section>
        )}
      </main>
    </div>
  );
}