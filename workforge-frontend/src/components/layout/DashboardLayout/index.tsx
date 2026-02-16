import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { useAuth } from '@context/AuthContext';
import { uiStore } from '@store/ui.store';

export const DashboardLayout = () => {
  const { user } = useAuth();
  const { sidebarOpen } = uiStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden w-full lg:ml-72">
        <Header
          variant="dashboard"
          title={user?.role === 'worker' ? 'Worker Dashboard' : user?.role === 'employer' ? 'Employer Dashboard' : 'Admin Dashboard'}
          onSidebarToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />

        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-slate-50 dark:bg-slate-900">
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