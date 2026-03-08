import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className="hidden md:block">
    <ol className="flex items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link to={item.href} className="max-w-40 truncate text-primary-blue hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="max-w-44 truncate text-gray-700">{item.label}</span>
            )}
            {!isLast ? <ChevronRightIcon className="h-4 w-4 text-gray-400" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  </nav>
);
