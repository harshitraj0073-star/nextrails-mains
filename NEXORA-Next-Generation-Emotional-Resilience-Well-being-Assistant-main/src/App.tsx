import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useStore } from './hooks/useStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SentientEnvironment } from './components/SentientEnvironment';
import { Login } from './pages/Login';
import { VictimLayout } from './layouts/VictimLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { VictimDashboard } from './pages/VictimDashboard';
import { CounsellorDashboard } from './pages/CounsellorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CaseProfile } from './pages/CaseProfile';
import { Reports } from './pages/Reports';
import { NexoraAIPage } from './pages/NexoraAIPage';

const RoleRouter: React.FC<{ counsellor: React.ReactNode, admin: React.ReactNode }> = ({ counsellor, admin }) => {
  const { state } = useStore();
  if (state.role === 'admin') return <>{admin}</>;
  return <>{counsellor}</>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="sentient-shell">
        <SentientEnvironment mode="patient" intensity={1.1}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />

              <Route element={<ProtectedRoute allowedRoles={['victim']}><VictimLayout /></ProtectedRoute>}>
                <Route path="/victim" element={<VictimDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['counsellor', 'admin']}><DashboardLayout /></ProtectedRoute>}>
                <Route
                  path="/dashboard"
                  element={
                    <RoleRouter
                      counsellor={<CounsellorDashboard />}
                      admin={<AdminDashboard />}
                    />
                  }
                />
                <Route path="/cases" element={<CounsellorDashboard />} />
                <Route path="/cases/:id" element={<CaseProfile />} />
                <Route path="/alerts" element={<CounsellorDashboard />} />
                <Route path="/analytics" element={<AdminDashboard />} />
                <Route path="/nexora-ai" element={<NexoraAIPage />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<div className="sentient-blank-state">Settings coming soon</div>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SentientEnvironment>
      </div>
    </AppProvider>
  );
};

export default App;
