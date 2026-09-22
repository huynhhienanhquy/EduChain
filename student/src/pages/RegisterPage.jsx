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
      const res = await client.post('/auth/register', { ...form, role: 'student' });
      login(res.data.data);
      setMessage('Đăng ký thành công');
      showToast('Tạo tài khoản học viên thành công', 'success');
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
          <span className="badge">Join EduChain</span>
          <h1>Tạo tài khoản học viên</h1>
          <p className="muted">Bắt đầu học, kết nối ví MetaMask và lưu lại thành tích học tập của bạn.</p>

          <form className="form" onSubmit={submit}>
            <label>Họ tên</label>
            <input placeholder="Nguyễn Văn A" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <label>Email</label>
            <input placeholder="student@educhain.local" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label>Mật khẩu</label>
            <input type="password" placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {message && <p className="success">{message}</p>}
            {error && <p className="field-error">{error}</p>}
            <button type="submit">Tạo tài khoản</button>
            <div className="form-help">
              <span className="muted">Đã có tài khoản?</span>
              <Link to="/login">Đăng nhập</Link>
            </div>
          </form>
        </div>

        <aside className="auth-side">
          <div>
            <span className="badge">Student Portal</span>
            <h2>Learn, pay and prove your skills.</h2>
            <p>EduChain kết hợp trải nghiệm EdTech hiện đại với thanh toán blockchain local.</p>
          </div>
          <div className="auth-illustration" />
          <div className="auth-chips"><span>Courses</span><span>Progress</span><span>ETH Payment</span><span>Digital Cert</span></div>
        </aside>
      </div>
    </section>
  );
}
