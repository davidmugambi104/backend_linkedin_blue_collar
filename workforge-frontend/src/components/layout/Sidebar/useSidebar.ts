import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  StarIcon,
  Cog6ToothIcon,
  UsersIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@context/AuthContext';
import { UserRole } from '@types';
import { SidebarSection } from './Sidebar.types';

const workerSections: SidebarSection[] = [
  {
    id: 'worker-primary',
    label: 'Workspace',
    items: [
      { id: 'worker-dashboard', label: 'Dashboard', to: '/worker/dashboard', icon: HomeIcon },
      { id: 'worker-jobs', label: 'Jobs', to: '/worker/jobs', icon: BriefcaseIcon },
      { id: 'worker-applications', label: 'Applications', to: '/worker/applications', icon: ClipboardDocumentCheckIcon },
      { id: 'worker-reviews', label: 'Reviews', to: '/worker/reviews', icon: StarIcon },
    ],
  },
  {
    id: 'worker-settings',
    label: 'Account',
    items: [
      { id: 'worker-settings', label: 'Settings', to: '/worker/settings', icon: Cog6ToothIcon },
    ],
  },
];

const employerSections: SidebarSection[] = [
  {
    id: 'employer-primary',
    label: 'Workspace',
    items: [
      { id: 'employer-dashboard', label: 'Dashboard', to: '/employer/dashboard', icon: HomeIcon },
      { id: 'employer-jobs', label: 'Jobs', to: '/employer/jobs', icon: BriefcaseIcon },
      { id: 'employer-applications', label: 'Applications', to: '/employer/applications', icon: ClipboardDocumentCheckIcon },
      { id: 'employer-workers', label: 'Workers', to: '/employer/workers', icon: UsersIcon },
      { id: 'employer-reviews', label: 'Reviews', to: '/employer/reviews', icon: StarIcon },
    ],
  },
  {
    id: 'employer-settings',
    label: 'Account',
    items: [
      { id: 'employer-settings', label: 'Settings', to: '/employer/settings', icon: Cog6ToothIcon },
    ],
  },
];

const adminSections: SidebarSection[] = [
  {
    id: 'admin-primary',
    label: 'Administration',
    items: [
      { id: 'admin-dashboard', label: 'Dashboard', to: '/admin/dashboard', icon: HomeIcon },
      { id: 'admin-users', label: 'Users', to: '/admin/users', icon: UsersIcon },
      { id: 'admin-jobs', label: 'Jobs', to: '/admin/jobs', icon: BriefcaseIcon },
      { id: 'admin-verifications', label: 'Verifications', to: '/admin/verifications', icon: ShieldCheckIcon },
      { id: 'admin-payments', label: 'Payments', to: '/admin/payments', icon: BanknotesIcon },
      { id: 'admin-reports', label: 'Reports', to: '/admin/reports', icon: ChartBarIcon },
    ],
  },
];

export const useSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role ?? UserRole.WORKER;

  const sections = useMemo(() => {
    if (role === UserRole.EMPLOYER) {
      return employerSections;
    }
    if (role === UserRole.ADMIN) {
      return adminSections;
    }
    return workerSections;
  }, [role]);

  const activePath = location.pathname;

  return {
    sections,
    activePath,
    role,
  };
};
