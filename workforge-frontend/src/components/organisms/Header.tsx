import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { Avatar, Button } from '@components/atoms';
import { BreadcrumbItem, Breadcrumbs, DropdownMenu } from '@components/molecules';

export interface HeaderProps {
  breadcrumbs: BreadcrumbItem[];
  userName: string;
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const Header = ({ breadcrumbs, userName, onToggleSidebar, isSidebarOpen = false }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <Button
          variant="icon"
          aria-label="Toggle sidebar"
          aria-expanded={isSidebarOpen}
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </Button>
        <span className="font-heading text-lg font-semibold text-dark-navy">Workforge</span>
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <Button variant="icon" aria-label="Notifications">
          <BellIcon className="h-6 w-6" aria-hidden="true" />
        </Button>
        <DropdownMenu
          label={userName}
          options={[{ label: 'Profile', onClick: () => undefined }, { label: 'Logout', onClick: () => undefined }]}
        />
        <Avatar name={userName} size="sm" />
      </div>
    </header>
  );
};
