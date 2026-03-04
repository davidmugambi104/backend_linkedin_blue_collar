import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../Header';

const RootLayout: React.FC = () => {
  const location = useLocation();
  const hideHeader = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideHeader && <Header variant="public" />}
      <Outlet />
    </div>
  );
};

export default RootLayout;
