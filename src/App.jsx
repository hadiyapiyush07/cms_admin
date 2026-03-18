import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminSignIn from './pages/Admin/AdminSignIn';          
import AdminLayout from './pages/Admin/AdminLayout';
import StudentManagement from './pages/Admin/StudentManagement';
import ProfessorManagement from './pages/Admin/ProfessorManagement';
import HandleGallery from './pages/Admin/HandleGallery';
import AdminHome from './pages/Admin/AdminHome';

function App() {
  return (
    <Routes>
      {/* Public login at root */}
      <Route path="/" element={<AdminSignIn />} />

      {/* Protected admin area */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="studentmanagement" element={<StudentManagement />} />
        <Route path="professormanagement" element={<ProfessorManagement />} />
        <Route path="handlegallery" element={<HandleGallery />} />
      </Route>

      {/* Redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;