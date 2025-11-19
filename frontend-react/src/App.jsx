import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import MaterialsPage from './pages/MaterialsPage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';
import SchedulePage from './pages/SchedulePage';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={
          <PrivateRoute>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="materials" element={<MaterialsPage />} />
                <Route path="quiz" element={<QuizPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route index element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </PrivateRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}
