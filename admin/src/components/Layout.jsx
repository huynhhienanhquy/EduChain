import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ToastProvider } from './ToastProvider.jsx';
import WalletBadge from './WalletBadge.jsx';

function shortAddress(value) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : 'Chưa kết nối';
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/create-course', label: 'Tạo khóa học', icon: '➕' },
  { path: '/manage-courses', label: 'Quản lý khóa học', icon: '📚' },
  { path: '/issue-certificate', label: 'Cấp chứng chỉ', icon: '🏆' },
  { path: '/send-eth', label: 'Tặng ETH', icon: '💸' },
  { path: '/connect-wallet', label: 'Kết nối ví', icon: '👛' },
  { path: '/manage-students', label: 'Quản lý sinh viên', icon: '👥' },
  { path: '/transactions', label: 'Lịch sử giao dịch', icon: '🔎' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const title = navItems.find((item) => isActive(item.path))?.label || 'EduChain Admin';

  return (
    <ToastProvider>
      <div className="app-shell">
        <aside className={`sidebar fixed-sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="logo brand-card">
            <span className="brand-mark">EC</span>
            <div>
              <p className="muted">Admin Portal</p>
              <h2>EduChain</h2>
            </div>
          </div>

          <nav className="menu">
            {navItems.map((item) => (
              <Link key={item.path} className={isActive(item.path) ? 'active' : ''} to={item.path} onClick={() => setMenuOpen(false)}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
            {!user && <Link to="/register">✨ Đăng ký</Link>}
            {!user && <Link to="/login">🔐 Đăng nhập</Link>}
          </nav>

          <div className="sidebar-footer-card">
            <p>Web3 Admin Console</p>
            <span>Ganache · MetaMask · Certificate</span>
          </div>

          {user && (
            <div className="user-box">
              <strong>{user.fullName}</strong>
              <p className="muted">{user.email}</p>
              <p className="muted">Ví: {shortAddress(user.walletAddress)}</p>
              <button onClick={logout}>Đăng xuất</button>
            </div>
          )}
        </aside>

        {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

        <main className="content with-sidebar">
          <header className="topbar">
            <button type="button" className="icon-button mobile-menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
            <div>
              <p className="eyebrow">Admin Workspace</p>
              <h1>{title}</h1>
            </div>
            <div className="topbar-actions">
              <WalletBadge fallbackAddress={user?.walletAddress} />
              {user ? <div className="avatar">{user.fullName?.slice(0, 1) || 'A'}</div> : <Link className="button-link secondary" to="/login">Đăng nhập</Link>}
            </div>
          </header>

          <div className="page-container">
            <Outlet />
          </div>

          <footer className="footer">
            <span>© EduChain Admin</span>
            <span>Learning Management powered by Web3</span>
          </footer>
        </main>
      </div>
    </ToastProvider>
  );
}
