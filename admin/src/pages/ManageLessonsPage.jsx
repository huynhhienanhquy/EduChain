import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client.js';
import { useToast } from '../components/ToastProvider.jsx';

const initialForm = {
  title: '',
  content: '',
  videoUrl: '',
  lessonOrder: 1,
};

export default function ManageLessonsPage() {
  const { id } = useParams();

  const [lessons, setLessons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingLessonId, setEditingLessonId] = useState(null);

  const [loadingLessons, setLoadingLessons] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const isEditing = useMemo(() => Boolean(editingLessonId), [editingLessonId]);

  const sortedLessons = useMemo(() => {
    return [...lessons].sort((a, b) => Number(a.lessonOrder) - Number(b.lessonOrder));
  }, [lessons]);

  const loadLessons = async () => {
    try {
      setLoadingLessons(true);
      setError('');

      const res = await client.get(`/courses/${id}/lessons`);
      setLessons(res.data.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không tải được danh sách bài giảng';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoadingLessons(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [id]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setEditingLessonId(null);
    setForm({
      ...initialForm,
      lessonOrder: lessons.length + 1,
    });
    setMessage('');
    setError('');
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Vui lòng nhập tiêu đề bài giảng';
    if (!form.content.trim()) return 'Vui lòng nhập nội dung bài giảng';

    const parsedOrder = Number(form.lessonOrder);

    if (Number.isNaN(parsedOrder) || parsedOrder <= 0) {
      return 'Thứ tự bài giảng phải là số lớn hơn 0';
    }

    if (form.videoUrl.trim()) {
      try {
        new URL(form.videoUrl.trim());
      } catch {
        return 'Video URL không hợp lệ';
      }
    }

    return '';
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    content: form.content.trim(),
    videoUrl: form.videoUrl.trim() || null,
    lessonOrder: Number(form.lessonOrder),
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
        res = await client.put(`/courses/lessons/${editingLessonId}`, payload);
      } else {
        res = await client.post(`/courses/${id}/lessons`, payload);
      }

      setMessage(res.data.message || 'Lưu bài giảng thành công');
      showToast(res.data.message || 'Lưu bài giảng thành công', 'success');

      setEditingLessonId(null);
      setForm({
        ...initialForm,
        lessonOrder: lessons.length + 2,
      });

      await loadLessons();
    } catch (err) {
      const msg = err.response?.data?.message || 'Lưu bài giảng thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (lesson) => {
    setEditingLessonId(lesson.id);

    setForm({
      title: lesson.title || '',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      lessonOrder: lesson.lessonOrder || 1,
    });

    setMessage('');
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const deleteLesson = async (lesson) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa bài giảng "${lesson.title}" không?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(lesson.id);
      setError('');
      setMessage('');

      const res = await client.delete(`/courses/lessons/${lesson.id}`);

      setMessage(res.data.message || 'Xóa bài giảng thành công');
      showToast(res.data.message || 'Xóa bài giảng thành công', 'success');

      if (editingLessonId === lesson.id) {
        resetForm();
      }

      await loadLessons();
    } catch (err) {
      const msg = err.response?.data?.message || 'Xóa bài giảng thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="stack">
      <section className="panel">
        <span className="badge">Lesson Manager</span>

        <h1>Quản lý bài giảng</h1>

        <p className="muted">
          Admin có thể thêm mới, chỉnh sửa và xóa bài giảng của khóa học. Các bài giảng được sắp xếp
          theo thứ tự lessonOrder.
        </p>

        <div className="actions wrap">
          <button type="button" onClick={resetForm}>
            + Thêm bài giảng mới
          </button>

          <button
            type="button"
            className="button-link secondary"
            onClick={loadLessons}
            disabled={loadingLessons}
          >
            {loadingLessons ? 'Đang tải...' : 'Làm mới danh sách'}
          </button>

          <span className="badge">
            Tổng bài giảng: {lessons.length}
          </span>
        </div>
      </section>

      <form className="panel form" onSubmit={submit}>
        <span className={isEditing ? 'badge success-badge' : 'badge'}>
          {isEditing ? `Đang sửa bài giảng #${editingLessonId}` : 'Thêm bài giảng'}
        </span>

        <h2>{isEditing ? 'Chỉnh sửa bài giảng' : 'Thêm bài giảng mới'}</h2>

        <label className="field-label">Tiêu đề bài giảng</label>
        <input
          value={form.title}
          onChange={(e) => updateForm('title', e.target.value)}
          placeholder="Ví dụ: Tổng quan về Blockchain"
        />

        <label className="field-label">Nội dung bài giảng</label>
        <textarea
          value={form.content}
          onChange={(e) => updateForm('content', e.target.value)}
          placeholder="Nhập nội dung bài giảng"
          rows={7}
        />

        <label className="field-label">Video URL</label>
        <input
          value={form.videoUrl}
          onChange={(e) => updateForm('videoUrl', e.target.value)}
          placeholder="https://youtube.com/..."
        />

        <label className="field-label">Thứ tự bài giảng</label>
        <input
          type="number"
          min="1"
          value={form.lessonOrder}
          onChange={(e) => updateForm('lessonOrder', e.target.value)}
          placeholder="1"
        />

        <div className="actions wrap">
          <button type="submit" disabled={saving}>
            {saving
              ? 'Đang lưu...'
              : isEditing
                ? 'Cập nhật bài giảng'
                : 'Thêm bài giảng'}
          </button>

          {isEditing && (
            <button
              type="button"
              className="button-link secondary"
              onClick={resetForm}
            >
              Hủy sửa
            </button>
          )}
        </div>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>

      <section className="panel">
        <h2>Danh sách bài giảng hiện có</h2>

        {loadingLessons ? (
          <p className="muted">Đang tải danh sách bài giảng...</p>
        ) : sortedLessons.length === 0 ? (
          <div className="card">
            <h3>Chưa có bài giảng</h3>
            <p className="muted">
              Khóa học này chưa có bài giảng nào. Hãy thêm bài giảng đầu tiên ở form bên trên.
            </p>
          </div>
        ) : (
          <div className="lesson-admin-list">
            {sortedLessons.map((lesson) => (
              <div key={lesson.id} className="lesson-admin-card">
                <div className="lesson-order-badge">
                  {lesson.lessonOrder}
                </div>

                <div className="lesson-admin-content">
                  <div className="actions wrap" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <span className="badge">Lesson #{lesson.id}</span>
                      <h3>{lesson.title}</h3>
                    </div>

                    <div className="actions wrap">
                      <button
                        type="button"
                        className="button-link secondary"
                        onClick={() => startEdit(lesson)}
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        className="button-link secondary danger"
                        onClick={() => deleteLesson(lesson)}
                        disabled={deletingId === lesson.id}
                      >
                        {deletingId === lesson.id ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </div>

                  <p className="muted lesson-preview">
                    {lesson.content}
                  </p>

                  {lesson.videoUrl ? (
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                      Mở video bài giảng
                    </a>
                  ) : (
                    <p className="muted">Chưa có video URL</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}