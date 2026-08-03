import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PDF_PASSWORD_REMOVER_ROUTE } from '@cm-flow-manager/pdf-password-remover';
import { AppShell } from './layout/AppShell';
import { AboutPage } from './pages/AboutPage';
import { ActivityPage } from './pages/ActivityPage';
import { DashboardPage } from './pages/DashboardPage';
import { PasswordRemoverPage } from './pages/PasswordRemoverPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path={PDF_PASSWORD_REMOVER_ROUTE.replace(/^\//, '')} element={<PasswordRemoverPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
