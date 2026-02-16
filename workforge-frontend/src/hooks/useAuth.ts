import { useAuth } from '@context/AuthContext';
import { UserRole } from '@types';

export const useAuthGuard = (allowedRoles: UserRole | UserRole[]) => {
  const { hasRole, isAuthenticated } = useAuth();
  
  const isAllowed = isAuthenticated && hasRole(allowedRoles);
  
  return {
    isAllowed,
    isAuthenticated,
  };
};

export const useWorkerGuard = () => {
  return useAuthGuard(UserRole.WORKER);
};

export const useEmployerGuard = () => {
  return useAuthGuard(UserRole.EMPLOYER);
};

export const useAdminGuard = () => {
  return useAuthGuard(UserRole.ADMIN);
};

export { useAuth };