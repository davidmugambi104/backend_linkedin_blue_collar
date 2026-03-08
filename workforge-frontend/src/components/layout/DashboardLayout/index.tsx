import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@context/AuthContext';
import { UserRole } from '@types';

export const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isEmployerDashboard =
    user?.role === UserRole.EMPLOYER || location.pathname.startsWith('/employer');
  const isAdminDashboard =
    user?.role === UserRole.ADMIN || location.pathname.startsWith('/admin');
  const isWorkerDashboard =
    user?.role === UserRole.WORKER || location.pathname.startsWith('/worker');

  return (
    <div
      className={`h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 ${
        isEmployerDashboard ? 'employer-m3' : ''
      } ${
        isAdminDashboard ? 'admin-corporate' : ''
      } ${
        isWorkerDashboard ? 'worker-clean' : ''
      }`}
    >
      {/* Fixed Sidebar */}
      <Sidebar className={isEmployerDashboard ? 'employer-shell-sidebar' : ''} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Header with Glassmorphism */}
        <Header className={isEmployerDashboard ? 'employer-shell-header' : ''} />

        {/* Page Content */}
        <main className={`flex-1 relative overflow-y-auto focus:outline-none bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 ${isEmployerDashboard ? 'employer-shell-main' : ''}`}>
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};