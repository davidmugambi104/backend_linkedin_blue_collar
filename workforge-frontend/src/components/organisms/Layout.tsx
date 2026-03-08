import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const labelFromPath = (path: string) =>
  path
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace('-', ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const parts = labelFromPath(location.pathname);
    const items = [{ label: 'Home', href: '/employer/dashboard' }];
    parts.slice(1).forEach((part, index) => {
      const href = `/${location.pathname.split('/').filter(Boolean).slice(0, index + 2).join('/')}`;
      const isLast = index === parts.slice(1).length - 1;
      items.push({ label: part, href: isLast ? undefined : href });
    });
    return items;
  }, [location.pathname]);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 font-body text-rich-black">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-level-2">
        Skip to content
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <div className="flex h-full flex-col lg:pl-64">
        <Header
          breadcrumbs={breadcrumbs}
          userName="Employer User"
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((value) => !value)}
        />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
