import {
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { NavigationItem } from '@components/molecules';
import { cn } from '@utils/cn';

export interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const items = [
  { to: '/employer/dashboard', label: 'Dashboard', icon: ChartBarSquareIcon },
  { to: '/employer/jobs', label: 'Jobs', icon: BriefcaseIcon },
  { to: '/employer/applications', label: 'Applications', icon: BuildingOffice2Icon },
  { to: '/employer/workers', label: 'Workers', icon: UserGroupIcon },
  { to: '/employer/reviews', label: 'Reviews', icon: StarIcon },
  { to: '/employer/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export const Sidebar = ({ open = false, onClose }: SidebarProps) => {
  return (
    <aside
      aria-label="Employer sidebar"
      className={cn(
        'fixed inset-y-0 left-0 z-50 h-screen w-64 transform overflow-y-auto bg-dark-navy px-3 py-4 text-white transition-transform duration-200 lg:translate-x-0 lg:transition-none',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="mb-6 px-2">
        <h2 className="font-heading text-xl font-semibold">Workforge</h2>
        <p className="text-sm text-blue-100">Employer Console</p>
      </div>
      <nav className="space-y-1" aria-label="Sidebar navigation">
        {items.map((item) => (
          <NavigationItem key={item.to} {...item} tone="dark" onNavigate={onClose} />
        ))}
      </nav>
      <div className="mt-8 rounded-lg border border-blue-900 bg-blue-900/40 p-4 text-sm text-blue-100">Upgrade to Pro for advanced hiring analytics.</div>
    </aside>
  );
};
