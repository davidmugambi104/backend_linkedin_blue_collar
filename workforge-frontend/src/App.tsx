import { Suspense, useEffect } from 'react';
import { AppRouter } from '@routes/AppRouter';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { useAuth } from '@context/AuthContext';
import { uiStore } from '@store/ui.store';

function App() {
  const { isLoading } = useAuth();
  const { theme } = uiStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AppRouter />
    </Suspense>
  );
}

export default App;