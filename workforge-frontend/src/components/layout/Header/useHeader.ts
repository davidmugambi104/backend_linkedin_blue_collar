import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';

interface UseHeaderOptions {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export const useHeader = ({ mobileOpen, onMobileOpenChange }: UseHeaderOptions) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const resolvedMobileOpen = mobileOpen ?? internalMobileOpen;
  const setMobileOpen = onMobileOpenChange ?? setInternalMobileOpen;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userMenuItems = useMemo(
    () => [
      { value: 'dashboard', label: 'Dashboard', onClick: () => navigate(`/${user?.role}/dashboard`) },
      { value: 'profile', label: 'Profile', onClick: () => navigate(`/${user?.role}/profile`) },
      { value: 'settings', label: 'Settings', onClick: () => navigate(`/${user?.role}/settings`) },
      { value: 'divider', type: 'divider' as const },
      { value: 'logout', label: 'Sign out', onClick: handleLogout, className: 'text-red-600 dark:text-red-400' },
    ],
    [handleLogout, navigate, user?.role]
  );

  return {
    user,
    isAuthenticated,
    isScrolled,
    mobileOpen: resolvedMobileOpen,
    setMobileOpen,
    userMenuItems,
  };
};
