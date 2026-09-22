import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ConnectWalletPage from './pages/ConnectWalletPage.jsx';
import CreateCoursePage from './pages/CreateCoursePage.jsx';
import ManageCoursesPage from './pages/ManageCoursesPage.jsx';
import ManageLessonsPage from './pages/ManageLessonsPage.jsx';
import ManageStudentsPage from './pages/ManageStudentsPage.jsx';
import ManageTestsPage from './pages/ManageTestsPage.jsx';
import IssueCertificatePage from './pages/IssueCertificatePage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import SendEthPage from './pages/SendEthPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ManageAllStudentsPage from './pages/ManageAllStudentsPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';


function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={import.meta.env.PROD ? <Navigate to="/login" replace /> : <RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/connect-wallet" element={<PrivateRoute><ConnectWalletPage /></PrivateRoute>} />
        <Route path="/create-course" element={<PrivateRoute><CreateCoursePage /></PrivateRoute>} />
        <Route path="/manage-courses" element={<PrivateRoute><ManageCoursesPage /></PrivateRoute>} />
        <Route path="/manage-courses/:id/lessons" element={<PrivateRoute><ManageLessonsPage /></PrivateRoute>} />
        <Route path="/manage-courses/:id/students" element={<PrivateRoute><ManageStudentsPage /></PrivateRoute>} />
        <Route path="/manage-courses/:id/tests" element={<PrivateRoute><ManageTestsPage /></PrivateRoute>} />
        <Route path="/issue-certificate" element={<PrivateRoute><IssueCertificatePage /></PrivateRoute>} />
        <Route path="/send-eth" element={<PrivateRoute><SendEthPage /></PrivateRoute>}/>
        <Route path="/manage-students" element={<PrivateRoute><ManageAllStudentsPage /></PrivateRoute>}/>
         <Route path="/profile"
    element={
      <PrivateRoute>
      <ProfilePage />
    </PrivateRoute>}/>
        <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
      </Route>


    </Routes>
  );
}
