# Admin Components Documentation

## Overview

The admin components provide a complete, cohesive design system for the WorkForge admin dashboard. All components work together with a consistent glass-morphism design aesthetic, smooth transitions, and dark mode support.

## Directory Structure

```
src/components/admin/
├── layout/
│   └── AdminLayout.tsx          # Main layout wrapper with sidebar and navbar
├── sidebar/
│   └── Sidebar.tsx              # Navigation sidebar with menu items
├── navbar/
│   ├── TopNavbar.tsx            # Top navigation bar
│   ├── AdminSearch.tsx          # Global search with ⌘K shortcut
│   ├── NotificationCenter.tsx   # Notification dropdown
│   └── UserMenu.tsx             # User profile menu
├── cards/
│   └── StatCard/
│       ├── StatCard.tsx         # KPI statistic cards
│       ├── StatCard.types.ts    # TypeScript types
│       └── index.ts             # Exports
├── tables/
│   └── AdminTable/
│       ├── AdminTable.tsx       # Sortable data table
│       ├── TablePagination.tsx  # Pagination controls
│       ├── AdminTable.types.ts  # TypeScript types
│       └── index.ts             # Exports
├── common/
│   └── StatusBadge/
│       ├── StatusBadge.tsx      # Status indicator badges
│       ├── StatusBadge.types.ts # TypeScript types
│       └── index.ts             # Exports
├── actions/
│   └── QuickActions/
│       ├── QuickActions.tsx     # Floating action button
│       ├── QuickActionButton.tsx # Action menu items
│       └── index.ts             # Exports
└── index.ts                     # Main exports
```

## Component Usage

### AdminLayout

Wraps all admin pages with consistent layout structure:

```tsx
import { AdminLayout } from '@components/admin/layout/AdminLayout';

export const MyAdminPage = () => {
  return (
    <AdminLayout>
      <h1>Page Content</h1>
      {/* Your page content */}
    </AdminLayout>
  );
};
```

Features:
- Responsive sidebar (hidden on mobile)
- Top navigation bar
- Floating quick actions button
- Glass-morphism design with backdrop blur
- Automatic dark mode support

### StatCard

Display KPI metrics with trend indicators:

```tsx
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { UsersIcon } from '@heroicons/react/24/outline';

<StatCard
  title="Total Users"
  value="12,847"
  change={12.5}
  trend="up"
  icon={UsersIcon}
  subtitle="Active users this month"
/>
```

Props:
- `title`: Card title
- `value`: Main metric value
- `change`: Percentage change (optional)
- `trend`: 'up' | 'down' (optional)
- `icon`: Heroicon component
- `subtitle`: Additional context (optional)
- `loading`: Skeleton state (optional)

### AdminTable

Sortable, paginated data table:

```tsx
import { AdminTable } from '@components/admin/tables/AdminTable/AdminTable';
import type { Column } from '@components/admin/tables/AdminTable/AdminTable.types';

const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'User',
    accessor: (user) => user.name,
    sortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    accessor: (user) => user.email,
    sortable: true,
  },
];

<AdminTable
  columns={columns}
  data={users}
  sortConfig={sortConfig}
  onSort={setSortConfig}
  pagination={{
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    pageSize: 10,
  }}
  onPageChange={setCurrentPage}
/>
```

Features:
- Sortable columns with visual indicators
- Custom cell rendering with `accessor`
- Built-in pagination
- Loading skeleton state
- Empty state support
- Hover effects and transitions

### StatusBadge

Colored status indicators:

```tsx
import { StatusBadge } from '@components/admin/common/StatusBadge/StatusBadge';

<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="suspended" />
<StatusBadge status="banned" />
```

Supported statuses:
- `active` - Green
- `pending` - Yellow
- `suspended` - Orange
- `banned` - Red
- `completed` - Blue
- `failed` - Red
- Custom text supported

### Sidebar

Fixed navigation sidebar with menu items:

Features:
- Active route highlighting
- Badge support for counts
- Glass-morphism styling
- User profile preview at bottom
- Smooth transitions

Menu items automatically configured for:
- Dashboard
- Users
- Jobs
- Payments
- Verifications
- Reports
- Settings

### TopNavbar

Top navigation bar with search and actions:

Features:
- Global search (⌘K shortcut)
- Notification center with badge
- User menu dropdown
- Dark mode support
- Glass-morphism styling

### QuickActions

Floating action button with quick commands:

Features:
- Fixed bottom-right position
- Expandable action panel
- Keyboard shortcuts
- Smooth animations

## Design System

### Colors

Uses Tailwind's primary colors with CSS variables:
- Primary: `from-primary-500 to-primary-600`
- Text: `text-gray-900 dark:text-white`
- Background: `bg-white/80 dark:bg-gray-900/80`

### Effects

- **Glass-morphism**: `backdrop-blur-xl` with transparent backgrounds
- **Gradients**: `bg-gradient-to-br` for depth
- **Shadows**: Subtle shadows with color-matching
- **Hover**: Scale transforms and shadow increases
- **Transitions**: `transition-all duration-200`

### Spacing

- Consistent `space-y-8` for page sections
- `gap-6` for grid layouts
- `px-4 sm:px-6 lg:px-8` for responsive padding

### Typography

- Headers: `text-3xl font-bold`
- Gradient text: `bg-gradient-to-r ... bg-clip-text text-transparent`
- Body: `text-sm` or `text-base`
- Muted: `text-gray-500 dark:text-gray-400`

## Page Examples

### Dashboard Example

```tsx
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { UsersIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export const AdminDashboard = () => {
  const stats = [
    {
      title: 'Total Users',
      value: '12,847',
      change: 12.5,
      trend: 'up' as const,
      icon: UsersIcon,
    },
    {
      title: 'Active Jobs',
      value: '345',
      change: 8.2,
      trend: 'up' as const,
      icon: BriefcaseIcon,
    },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor platform performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </AdminLayout>
  );
};
```

### Users Management Example

See `src/pages/admin/Users/AdminUsers.tsx` for a complete example with:
- AdminLayout wrapper
- Statistics cards
- AdminTable with sorting
- Pagination
- Status badges

## Responsive Behavior

- **Desktop (lg+)**: Sidebar visible, full table columns
- **Tablet (md)**: Sidebar hidden, hamburger menu (TODO)
- **Mobile (sm)**: Stacked cards, simplified table

## Dark Mode

All components automatically support dark mode using Tailwind's `dark:` variants. No additional configuration needed.

## Future Enhancements

- [ ] Mobile hamburger menu
- [ ] Command palette (⌘K)
- [ ] Bulk actions in tables
- [ ] Export data functionality
- [ ] Real-time notifications
- [ ] Advanced filters
- [ ] Chart components
- [ ] Analytics widgets

## Notes

- All components use path aliases (`@components`, `@lib`, etc.)
- Icons from `@heroicons/react/24/outline` and `/solid`
- TypeScript strict mode supported
- Fully accessible with proper ARIA labels
- Performance optimized with React.memo where needed
