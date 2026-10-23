/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.tsx';

// Pages
import { LoginPage } from './pages/LoginPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ProjectsPage } from './pages/ProjectsPage.tsx';
import { ProjectDetailPage } from './pages/ProjectDetailPage.tsx';
import { ProjectTasksPage } from './pages/ProjectTasksPage.tsx';
import { ProjectTeamPage } from './pages/ProjectTeamPage.tsx';
import { TaskDetailPage } from './pages/TaskDetailPage.tsx';
import { UsersPage } from './pages/UsersPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Authenticated Workspace Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/tasks" element={<ProjectTasksPage />} />
            <Route path="/projects/:id/team" element={<ProjectTeamPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />

            {/* Admin-only route */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
