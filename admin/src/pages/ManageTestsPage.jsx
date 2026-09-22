import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client.js';
import { useToast } from '../components/ToastProvider.jsx';

const emptyQuestion = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
};

const initialForm = {
  title: 'Bài test cuối khóa',
  passScore: 70,
  questions: [{ ...emptyQuestion }],
};

export default function ManageTestsPage() {
  const { id } = useParams();

  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingTestId, setEditingTestId] = useState(null);

  const [loadingTests, setLoadingTests] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const isEditing = useMemo(() => Boolean(editingTestId), [editingTestId]);

  const loadTests = async () => {
    try {
      setLoadingTests(true);
      setError('');

      const res = await client.get(`/tests/course/${id}`);
      setTests(res.data.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không tải được danh sách bài test';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [id]);

  const resetForm = () => {
    setForm({
      title: 'Bài test cuối khóa',
      passScore: 70,
      questions: [{ ...emptyQuestion }],
    });
    setEditingTestId(null);
    setMessage('');
    setError('');
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateQuestion = (index, field, value) => {
    setForm((prev) => {
      const nextQuestions = [...prev.questions];
      nextQuestions[index] = {
        ...nextQuestions[index],
        [field]: value,
      };

      return {
        ...prev,
        questions: nextQuestions,
      };
    });
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...emptyQuestion }],
    }));
  };

  const removeQuestion = (index) => {
    if (form.questions.length === 1) {
      showToast('Bài test phải có ít nhất 1 câu hỏi', 'warning');
      return;
    }

    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Vui lòng nhập tên bài test';

    const parsedPassScore = Number(form.passScore);

    if (
      Number.isNaN(parsedPassScore) ||
      parsedPassScore < 0 ||
      parsedPassScore > 100
    ) {
      return 'Điểm đạt phải nằm trong khoảng 0 - 100';
    }

    if (!form.questions.length) return 'Phải có ít nhất 1 câu hỏi';

    for (let i = 0; i < form.questions.length; i += 1) {
      const q = form.questions[i];

      if (!q.questionText.trim()) return `Câu hỏi ${i + 1} chưa nhập nội dung`;
      if (!q.optionA.trim()) return `Câu hỏi ${i + 1} chưa nhập đáp án A`;
      if (!q.optionB.trim()) return `Câu hỏi ${i + 1} chưa nhập đáp án B`;
      if (!q.optionC.trim()) return `Câu hỏi ${i + 1} chưa nhập đáp án C`;
      if (!q.optionD.trim()) return `Câu hỏi ${i + 1} chưa nhập đáp án D`;

      if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
        return `Câu hỏi ${i + 1} có đáp án đúng không hợp lệ`;
      }
    }

    return '';
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    passScore: Number(form.passScore),
    questions: form.questions.map((q) => ({
      questionText: q.questionText.trim(),
      optionA: q.optionA.trim(),
      optionB: q.optionB.trim(),
      optionC: q.optionC.trim(),
      optionD: q.optionD.trim(),
      correctAnswer: q.correctAnswer,
    })),
  });

  const submit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setMessage('');
      showToast(validationError, 'error');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = buildPayload();

      let res;

      if (isEditing) {
        res = await client.put(`/tests/${editingTestId}`, payload);
      } else {
        res = await client.post(`/tests/${id}`, payload);
      }

      setMessage(res.data.message || 'Lưu bài test thành công');
      showToast(res.data.message || 'Lưu bài test thành công', 'success');

      resetForm();
      await loadTests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Lưu bài test thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (test) => {
    setEditingTestId(test.id);

    setForm({
      title: test.title || '',
      passScore: test.passScore ?? 70,
      questions:
        test.questions?.length > 0
          ? test.questions.map((q) => ({
              questionText: q.questionText || '',
              optionA: q.optionA || '',
              optionB: q.optionB || '',
              optionC: q.optionC || '',
              optionD: q.optionD || '',
              correctAnswer: q.correctAnswer || 'A',
            }))
          : [{ ...emptyQuestion }],
    });

    setMessage('');
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const deleteTest = async (test) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa bài test "${test.title}" không? Kết quả làm bài liên quan cũng sẽ bị xóa.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(test.id);
      setError('');
      setMessage('');

      const res = await client.delete(`/tests/${test.id}`);

      showToast(res.data.message || 'Xóa bài test thành công', 'success');
      setMessage(res.data.message || 'Xóa bài test thành công');

      if (editingTestId === test.id) {
        resetForm();
      }

      await loadTests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Xóa bài test thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="stack">
      <section className="panel">
        <span className="badge">Test Manager</span>

        <h1>Quản lý bài test</h1>

        <p className="muted">
          Admin có thể thêm mới, sửa và xóa bài test của khóa học. Mỗi bài test có nhiều câu hỏi
          và điểm đạt riêng.
        </p>

        <div className="actions wrap">
          <button type="button" onClick={resetForm}>
            + Tạo bài test mới
          </button>

          <button type="button" className="button-link secondary" onClick={loadTests}>
            Làm mới danh sách
          </button>

          <span className="badge">
            Tổng bài test: {tests.length}
          </span>
        </div>
      </section>

      <form className="panel form" onSubmit={submit}>
        <span className={isEditing ? 'badge success-badge' : 'badge'}>
          {isEditing ? `Đang sửa bài test #${editingTestId}` : 'Thêm bài test mới'}
        </span>

        <h2>{isEditing ? 'Sửa bài test' : 'Thêm bài test'}</h2>

        <label className="field-label">Tên bài test</label>
        <input
          value={form.title}
          onChange={(e) => updateForm('title', e.target.value)}
          placeholder="Tên bài test"
        />

        <label className="field-label">Điểm đạt</label>
        <input
          type="number"
          value={form.passScore}
          onChange={(e) => updateForm('passScore', e.target.value)}
          placeholder="Điểm đạt"
          min="0"
          max="100"
        />

        <div className="actions wrap">
          <h3 style={{ margin: 0 }}>Danh sách câu hỏi</h3>

          <button type="button" className="button-link secondary" onClick={addQuestion}>
            + Thêm câu hỏi
          </button>
        </div>

        {form.questions.map((q, index) => (
          <div key={index} className="card">
            <div className="actions wrap" style={{ justifyContent: 'space-between' }}>
              <span className="badge">Câu hỏi {index + 1}</span>

              <button
                type="button"
                className="button-link secondary"
                onClick={() => removeQuestion(index)}
              >
                Xóa câu hỏi
              </button>
            </div>

            <label className="field-label">Nội dung câu hỏi</label>
            <input
              placeholder="Câu hỏi"
              value={q.questionText}
              onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
            />

            <label className="field-label">Đáp án A</label>
            <input
              placeholder="Đáp án A"
              value={q.optionA}
              onChange={(e) => updateQuestion(index, 'optionA', e.target.value)}
            />

            <label className="field-label">Đáp án B</label>
            <input
              placeholder="Đáp án B"
              value={q.optionB}
              onChange={(e) => updateQuestion(index, 'optionB', e.target.value)}
            />

            <label className="field-label">Đáp án C</label>
            <input
              placeholder="Đáp án C"
              value={q.optionC}
              onChange={(e) => updateQuestion(index, 'optionC', e.target.value)}
            />

            <label className="field-label">Đáp án D</label>
            <input
              placeholder="Đáp án D"
              value={q.optionD}
              onChange={(e) => updateQuestion(index, 'optionD', e.target.value)}
            />

            <label className="field-label">Đáp án đúng</label>
            <select
              value={q.correctAnswer}
              onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        ))}

        <div className="actions wrap">
          <button type="submit" disabled={saving}>
            {saving
              ? 'Đang lưu...'
              : isEditing
                ? 'Cập nhật bài test'
                : 'Thêm bài test'}
          </button>

          {isEditing && (
            <button type="button" className="button-link secondary" onClick={resetForm}>
              Hủy sửa
            </button>
          )}
        </div>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>

      <section className="panel">
        <h2>Danh sách bài test hiện có</h2>

        {loadingTests ? (
          <p className="muted">Đang tải danh sách bài test...</p>
        ) : tests.length === 0 ? (
          <div className="card">
            <h3>Chưa có bài test</h3>
            <p className="muted">
              Khóa học này chưa có bài test nào. Hãy tạo bài test đầu tiên ở form bên trên.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên bài test</th>
                  <th>Điểm đạt</th>
                  <th>Số câu hỏi</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td>#{test.id}</td>
                    <td>
                      <strong>{test.title}</strong>
                    </td>
                    <td>{test.passScore}</td>
                    <td>{test.questions?.length || 0}</td>
                    <td>
                      {test.createdAt
                        ? new Date(test.createdAt).toLocaleString('vi-VN')
                        : '-'}
                    </td>
                    <td>
                      <div className="actions wrap">
                        <button
                          type="button"
                          className="button-link secondary"
                          onClick={() => startEdit(test)}
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          className="button-link secondary"
                          onClick={() => deleteTest(test)}
                          disabled={deletingId === test.id}
                        >
                          {deletingId === test.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}