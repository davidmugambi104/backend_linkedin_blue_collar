import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="public" />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};