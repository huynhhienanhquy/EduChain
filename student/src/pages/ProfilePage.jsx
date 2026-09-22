import { useState } from 'react';
import client from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../components/ToastProvider.jsx';

function shortAddress(address) {
  if (!address) return 'Chưa kết nối ví';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const updatePasswordField = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Họ tên không được để trống');
      showToast('Họ tên không được để trống', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      setError('');
      setMessage('');

      const res = await client.put('/auth/me', {
        fullName: fullName.trim(),
      });

      updateUser(res.data.data);
      setMessage(res.data.message || 'Cập nhật profile thành công');
      showToast('Cập nhật profile thành công', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Cập nhật profile thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    try {
      setChangingPassword(true);
      setError('');
      setMessage('');

      const res = await client.put('/auth/change-password', passwordForm);

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setMessage(res.data.message || 'Đổi mật khẩu thành công');
      showToast('Đổi mật khẩu thành công', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="stack">
      <section className="panel hero">
        <div className="hero-content">
          <div>
            <span className="badge">Student Profile</span>
            <h1>Hồ sơ học viên</h1>
            <p className="hero-subtext">
              Quản lý thông tin cá nhân, ví MetaMask dùng để mua khóa học và bảo mật tài khoản.
            </p>

            <div className="actions wrap">
              <span className="badge">Role: {user?.role}</span>
              <span className="badge">Email: {user?.email}</span>
              <span className={user?.walletAddress ? 'badge success-badge' : 'badge'}>
                Ví: {shortAddress(user?.walletAddress)}
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="profile-card">
              <div className="profile-avatar">
                {user?.fullName?.slice(0, 1)?.toUpperCase() || 'S'}
              </div>

              <h3>{user?.fullName}</h3>
              <p className="muted">{user?.email}</p>
              <p className="muted break-text">{user?.walletAddress || 'Chưa kết nối ví'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid two-columns">
        <form className="panel form" onSubmit={saveProfile}>
          <span className="badge">Account Info</span>
          <h2>Thông tin học viên</h2>

          <label className="field-label">Họ tên</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nhập họ tên"
          />

          <label className="field-label">Email</label>
          <input value={user?.email || ''} readOnly />

          <label className="field-label">Vai trò</label>
          <input value={user?.role || ''} readOnly />

          <label className="field-label">Ví MetaMask</label>
          <input value={user?.walletAddress || 'Chưa kết nối ví'} readOnly />

          <button type="submit" disabled={savingProfile}>
            {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>

          <p className="muted">
            Ví dùng để mua khóa học và nhận chứng chỉ. Muốn đổi ví, hãy dùng trang Kết nối ví.
          </p>
        </form>

        <form className="panel form" onSubmit={changePassword}>
          <span className="badge">Security</span>
          <h2>Đổi mật khẩu</h2>

          <label className="field-label">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => updatePasswordField('currentPassword', e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
          />

          <label className="field-label">Mật khẩu mới</label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => updatePasswordField('newPassword', e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
          />

          <label className="field-label">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
          />

          <button type="submit" disabled={changingPassword}>
            {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>

          <p className="muted">
            Nên dùng mật khẩu đủ mạnh và không chia sẻ tài khoản học viên cho người khác.
          </p>
        </form>
      </section>

      {message && <div className="panel"><p className="success">{message}</p></div>}
      {error && <div className="panel"><p className="error">{error}</p></div>}
    </div>
  );
}