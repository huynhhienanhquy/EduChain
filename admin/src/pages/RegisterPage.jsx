import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Vui lòng nhập đủ thông tin, mật khẩu tối thiểu 6 ký tự');
      return;
    }
    try {
      setError('');
      const res = await client.post('/auth/register', { ...form, role: 'admin' });
      login(res.data.data);
      setMessage('Đăng ký thành công');
      showToast('Tạo tài khoản Admin thành công', 'success');
      navigate('/connect-wallet');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <section className="auth-page">
      <div className="panel auth-card">
        <div className="auth-form">
          <span className="badge">Create Admin</span>
          <h1>Tạo tài khoản quản trị</h1>
          <p className="muted">Thiết lập tài khoản Admin để quản lý toàn bộ hệ thống EduChain.</p>

          <form className="form" onSubmit={submit}>
            <label>Họ tên</label>
            <input placeholder="Nguyễn Văn A" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <label>Email</label>
            <input placeholder="admin@educhain.local" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label>Mật khẩu</label>
            <input type="password" placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {message && <p className="success">{message}</p>}
            {error && <p className="field-error">{error}</p>}
            <button type="submit">Tạo tài khoản</button>
            <div className="form-help">
              <span className="muted">Đã có tài khoản?</span>
              <Link to="/login">Đăng nhập Admin</Link>
            </div>
          </form>
        </div>

        <aside className="auth-side">
          <div>
            <span className="badge">Admin Console</span>
            <h2>Build, publish and certify learning experiences.</h2>
            <p>Giao diện dành cho quản trị viên tạo khóa học, bài test và chứng chỉ số.</p>
          </div>
          <div className="auth-illustration" />
          <div className="auth-chips">
            <span>Courses</span><span>Students</span><span>Tests</span><span>ETH Faucet</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
