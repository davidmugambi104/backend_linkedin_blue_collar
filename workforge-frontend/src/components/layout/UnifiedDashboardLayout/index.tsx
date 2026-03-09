/**
 * Unified Dashboard Layout
 * Combines best features from Layout.tsx and DashboardLayout
 * Supports all roles: employer, worker, admin
 */
import React, { useState, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../DashboardLayout/Sidebar';
import { Header } from '../DashboardLayout/Header';

interface UnifiedDashboardLayoutProps {
  // Layout is role-aware via the Sidebar component
}

export const UnifiedDashboardLayout: React.FC<UnifiedDashboardLayoutProps> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Generate breadcrumbs from current path
  const labelFromPath = (path: string) =>
    path
      .split('/')
      .filter(Boolean)
      .map((segment) => segment.replace(/-/g, ' '))
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

  const breadcrumbs = useMemo(() => {
    const parts = labelFromPath(location.pathname);
    const items: { label: string; href?: string }[] = [{ label: 'Home', href: '/' }];
    
    parts.slice(1).forEach((part, index) => {
      const pathParts = location.pathname.split('/').filter(Boolean);
      const href = '/' + pathParts.slice(0, index + 2).join('/');
      const isLast = index === parts.slice(1).length - 1;
      items.push({ label: part, href: isLast ? undefined : href });
    });
    
    return items;
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    setSidebarOpen((value) => !value);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50">
      {/* Accessibility skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={handleCloseSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0 ml-64">
        {/* Header with breadcrumbs */}
        <Header
          breadcrumbs={breadcrumbs}
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Page Content - Scrollable */}
        <main 
          id="main-content" 
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          <div className="min-h-full">
            {/* Consistent container with max-width */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UnifiedDashboardLayout;
