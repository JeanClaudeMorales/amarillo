import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Network from './pages/Network';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Success from './pages/Success';
import Geography from './pages/Geography';
import AccessPoints from './pages/AccessPoints';
import Content from './pages/Content';
import AdminManagement from './pages/AdminManagement';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Captive Portal */}
          <Route path="/" element={<UserLogin />} />
          <Route path="/success" element={<Success />} />

          {/* Admin Auth */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin/geography" element={<ProtectedRoute><Geography /></ProtectedRoute>} />
          <Route path="/admin/access-points" element={<ProtectedRoute><AccessPoints /></ProtectedRoute>} />
          <Route path="/admin/content" element={<ProtectedRoute><Content /></ProtectedRoute>} />
          <Route path="/admin/admins" element={<ProtectedRoute requiredRole="superadmin"><AdminManagement /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
