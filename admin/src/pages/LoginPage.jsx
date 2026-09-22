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
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    try {
      setError('');
      const res = await client.post('/auth/login', { email, password });
      if (res.data.data.user.role !== 'admin') {
        setError('Tài khoản này không phải admin');
        showToast('Tài khoản này không có quyền Admin', 'error');
        return;
      }
      login(res.data.data);
      showToast('Đăng nhập Admin thành công', 'success');
      navigate('/connect-wallet');
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại';
      setError(message);
      showToast(message, 'error');
    }
  };

  return (
    <section className="auth-page">
      <div className="panel auth-card">
        <div className="auth-form">
          <span className="badge">Admin Access</span>
          <h1>Đăng nhập EduChain Admin</h1>
          <p className="muted">Quản lý khóa học, học viên, giao dịch MetaMask và chứng chỉ số trên một dashboard chuyên nghiệp.</p>

          <form className="form" onSubmit={submit}>
            <label>Email</label>
            <input placeholder="admin@educhain.local" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label>Mật khẩu</label>
            <input type="password" placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="field-error">{error}</p>}
            <button type="submit">Đăng nhập</button>
            {!import.meta.env.PROD && (
              <div className="form-help">
                <span className="muted">Chưa có tài khoản?</span>
                <Link to="/register">Tạo Admin account</Link>
              </div>
            )}
          </form>
        </div>

        <aside className="auth-side">
          <div>
            <span className="badge">Web3 LMS</span>
            <h2>Operate courses with blockchain trust.</h2>
            <p>Tạo khóa học on-chain, theo dõi thanh toán ETH local Ganache và cấp chứng chỉ số rõ ràng.</p>
          </div>
          <div className="auth-illustration" />
          <div className="auth-chips">
            <span>MetaMask</span><span>Ganache</span><span>Smart Contract</span><span>Certificates</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
