import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ConnectWalletPage from './pages/ConnectWalletPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import MyCoursesPage from './pages/MyCoursesPage.jsx';
import CourseLearningPage from './pages/CourseLearningPage.jsx';
import CertificatesPage from './pages/CertificatesPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import VerifyCertificatePage from './pages/VerifyCertificatePage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />

        {/* Public route - không cần đăng nhập */}
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />

        <Route
          path="/connect-wallet"
          element={
            <PrivateRoute>
              <ConnectWalletPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/my-courses"
          element={
            <PrivateRoute>
              <MyCoursesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/learn/:id"
          element={
            <PrivateRoute>
              <CourseLearningPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/certificates"
          element={
            <PrivateRoute>
              <CertificatesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <PrivateRoute>
              <TransactionsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}