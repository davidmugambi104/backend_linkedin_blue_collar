import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@context/AuthContext';

export const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Header with Glassmorphism */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
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