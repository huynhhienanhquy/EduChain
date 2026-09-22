import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ToastProvider } from './ToastProvider.jsx';
import WalletBadge from './WalletBadge.jsx';

function shortAddress(value) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : 'Chưa kết nối';
}

const navItems = [
  { path: '/', label: 'Trang chủ', icon: '🏠' },
  { path: '/courses', label: 'Khóa học', icon: '📚' },
  { path: '/my-courses', label: 'Khóa học của tôi', icon: '🎒' },
  { path: '/certificates', label: 'Chứng chỉ', icon: '🏆' },
  { path: '/connect-wallet', label: 'Kết nối ví', icon: '👛' },
  { path: '/transactions', label: 'Lịch sử giao dịch', icon: '🔎' },
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/verify-certificate', label: 'Xác minh chứng chỉ', iconClass: 'fa-solid fa-award' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const title = navItems.find((item) => isActive(item.path))?.label || 'EduChain Student';

  return (
    <ToastProvider>
      <div className="app-shell">
        <aside className={`sidebar fixed-sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="logo brand-card">
            <span className="brand-mark">EC</span>
            <div>
              <p className="muted">Student Portal</p>
              <h2>EduChain</h2>
            </div>
          </div>

          <nav className="menu">
                  {navItems.map((item) => (
        <Link
          key={item.path}
          className={isActive(item.path) ? 'active' : ''}
          to={item.path}
          onClick={() => setMenuOpen(false)}
        >
          <span className="nav-icon">
            {item.iconClass ? <i className={item.iconClass}></i> : item.icon}
          </span>
          {item.label}
        </Link>
      ))}
            {!user && <Link to="/register">✨ Đăng ký</Link>}
            {!user && <Link to="/login">🔐 Đăng nhập</Link>}
          </nav>

          <div className="sidebar-footer-card">
            <p>Learn · Pay · Certify</p>
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
              <p className="eyebrow">Student Workspace</p>
              <h1>{title}</h1>
            </div>
            <div className="topbar-actions">
              <WalletBadge fallbackAddress={user?.walletAddress} />
              {user ? <div className="avatar">{user.fullName?.slice(0, 1) || 'S'}</div> : <Link className="button-link secondary" to="/login">Đăng nhập</Link>}
            </div>
          </header>

          <div className="page-container">
            <Outlet />
          </div>

          <footer className="footer">
            <span>© EduChain Student</span>
            <span>Online learning powered by Web3</span>
          </footer>
        </main>
      </div>
    </ToastProvider>
  );
}
