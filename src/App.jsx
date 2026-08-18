import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminSignIn from './pages/Admin/AdminSignIn';          
import AdminLayout from './pages/Admin/AdminLayout';
import StudentManagement from './pages/Admin/StudentManagement';
import ProfessorManagement from './pages/Admin/ProfessorManagement';
import HandleGallery from './pages/Admin/HandleGallery';
import AdminHome from './pages/Admin/AdminHome';
import AdminManagement from './pages/Admin/AdminManagement';
import Notification from './pages/Admin/NotificationManagement';
import Subject from './pages/Admin/SubjectHandle';
import Fees from './pages/Admin/AdminFees';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOTP from './pages/VerifyOTP';
import ChangePassword from './components/changepassword';

function App() {
  return (
    <Routes>

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

      {/* Public login at root */}
      <Route path="/" element={<AdminSignIn />} />

      {/* Protected admin area */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="studentmanagement" element={<StudentManagement />} />
        <Route path="professormanagement" element={<ProfessorManagement />} />
        <Route path="adminmanagement" element={<AdminManagement />} />
        <Route path="handlegallery" element={<HandleGallery />} />
        <Route path="notification" element={<Notification />} />
        <Route path="subject" element={<Subject/>}/>
        <Route path="fees" element={<Fees/>} />
      </Route>

      {/* Redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;