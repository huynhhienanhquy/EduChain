import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    try {
      setError('');
      const res = await client.post('/auth/login', { email, password });
      if (res.data.data.user.role !== 'student') {
        setError('Tài khoản này không phải student');
        showToast('Tài khoản này không phải Student', 'error');
        return;
      }
      login(res.data.data);
      showToast('Đăng nhập thành công', 'success');
      navigate('/courses');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <section className="auth-page">
      <div className="panel auth-card">
        <div className="auth-form">
          <span className="badge">Student Access</span>
          <h1>Đăng nhập học tập</h1>
          <p className="muted">Truy cập khóa học, thanh toán bằng MetaMask và nhận chứng chỉ số sau khi hoàn thành.</p>

          <form className="form" onSubmit={submit}>
            <label>Email</label>
            <input placeholder="student@educhain.local" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label>Mật khẩu</label>
            <input type="password" placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="field-error">{error}</p>}
            <button type="submit">Đăng nhập</button>
            <div className="form-help">
              <span className="muted">Chưa có tài khoản?</span>
              <Link to="/register">Đăng ký học viên</Link>
            </div>
          </form>
        </div>

        <aside className="auth-side">
          <div>
            <span className="badge">Learn on Web3</span>
            <h2>Own your learning journey.</h2>
            <p>Mua khóa học bằng ETH local, học bài giảng và xác thực năng lực bằng chứng chỉ số.</p>
          </div>
          <div className="auth-illustration" />
          <div className="auth-chips"><span>Online Courses</span><span>MetaMask</span><span>Tests</span><span>Certificates</span></div>
        </aside>
      </div>
    </section>
  );
}
