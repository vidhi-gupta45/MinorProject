import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { ReportIssuePage } from './pages/student/ReportIssuePage';
import { MyIssuesPage } from './pages/student/MyIssuesPage';
import { IssueDetailPage } from './pages/student/IssueDetailPage';
import { HandlerDashboardPage } from './pages/handler/HandlerDashboardPage';
import { AssignedIssuesPage } from './pages/handler/AssignedIssuesPage';
import { HandlerIssueDetailPage } from './pages/handler/HandlerIssueDetailPage';
import { HodDashboardPage } from './pages/hod/HodDashboardPage';
import { DepartmentIssuesPage } from './pages/hod/DepartmentIssuesPage';
import { RoutingRulesPage } from './pages/hod/RoutingRulesPage';
import { DeptAnalyticsPage } from './pages/hod/DeptAnalyticsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { CategoryAndSlaPage } from './pages/admin/CategoryAndSlaPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Layout */}
          <Route element={<AppLayout showSidebar={false} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Student Protected Route Tree */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                <AppLayout showSidebar={true} currentRole="ROLE_STUDENT" />
              </ProtectedRoute>
            }
          >
            <Route path="/student" element={<StudentDashboardPage />} />
            <Route path="/student/report" element={<ReportIssuePage />} />
            <Route path="/student/issues" element={<MyIssuesPage />} />
            <Route path="/student/issues/:id" element={<IssueDetailPage />} />
          </Route>

          {/* Handler Protected Route Tree */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY']}>
                <AppLayout showSidebar={true} currentRole="ROLE_FACULTY" />
              </ProtectedRoute>
            }
          >
            <Route path="/handler" element={<HandlerDashboardPage />} />
            <Route path="/handler/workload" element={<HandlerDashboardPage />} />
            <Route path="/handler/issues" element={<AssignedIssuesPage />} />
            <Route path="/handler/issues/:id" element={<HandlerIssueDetailPage />} />
          </Route>

          {/* HOD Protected Route Tree */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <AppLayout showSidebar={true} currentRole="ROLE_HOD" />
              </ProtectedRoute>
            }
          >
            <Route path="/hod" element={<HodDashboardPage />} />
            <Route path="/hod/issues" element={<DepartmentIssuesPage />} />
            <Route path="/hod/routing" element={<RoutingRulesPage />} />
            <Route path="/hod/analytics" element={<DeptAnalyticsPage />} />
          </Route>

          {/* Admin Protected Route Tree */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <AppLayout showSidebar={true} currentRole="ROLE_ADMIN" />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/categories" element={<CategoryAndSlaPage />} />
            <Route path="/admin/audit" element={<AuditLogsPage />} />
            <Route path="/admin/*" element={<AdminDashboardPage />} />
          </Route>

          {/* Universal Protected Route: Notification Center */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['ROLE_STUDENT', 'ROLE_FACULTY', 'ROLE_HOD', 'ROLE_ADMIN']}>
                <AppLayout showSidebar={true} />
              </ProtectedRoute>
            }
          >
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* 404 Fallback */}
          <Route element={<AppLayout showSidebar={false} />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
