import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './shared/components/ProtectedRoute';

// Pages
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import StudentsPage from './features/students/StudentsPage';
import TeachersPage from './features/teachers/TeachersPage';
import SchedulePage from './features/schedule/SchedulePage';
import AttendancePage from './features/attendance/AttendancePage';
import GradesPage from './features/grades/GradesPage';
import PaymentsPage from './features/payments/PaymentsPage';
import ClassesPage from './features/students/ClassesPage';
import SubjectsPage from './features/subjects/SubjectsPage';
import UsersPage from './features/users/UsersPage';
// الوحدات الجديدة
import TransportationPage from './features/transportation/TransportationPage';
import InventoryPage from './features/inventory/InventoryPage';
import ActivitiesPage from './features/activities/ActivitiesPage';
import ExamsPage from './features/exams/ExamsPage';
import SettingsPage from './features/settings/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          
          <Route path="/students" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><StudentsPage /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute allowedRoles={['admin']}><ClassesPage /></ProtectedRoute>} />
          
          <Route path="/teachers" element={<ProtectedRoute allowedRoles={['admin']}><TeachersPage /></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute allowedRoles={['admin']}><SubjectsPage /></ProtectedRoute>} />
          
          <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
          
          <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
          
          <Route path="/grades" element={<ProtectedRoute><GradesPage /></ProtectedRoute>} />
          
          <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
          
          <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
          
          {/* الوحدات الجديدة */}
          <Route path="/transportation" element={<ProtectedRoute allowedRoles={['admin']}><TransportationPage /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin']}><InventoryPage /></ProtectedRoute>} />
          <Route path="/activities" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
          <Route path="/exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
