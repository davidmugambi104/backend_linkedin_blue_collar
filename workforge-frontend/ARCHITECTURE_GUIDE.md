# WorkForge Frontend - Complete Architecture & Connection Guide

## Table of Contents
1. [Overview](#overview)
2. [Application Entry Flow](#application-entry-flow)
3. [Component Architecture](#component-architecture)
4. [Routing System](#routing-system)
5. [Page Organization](#page-organization)
6. [User Journey](#user-journey)
7. [File Structure](#file-structure)
8. [Best Practices](#best-practices)

---

## Overview

WorkForge is a role-based job marketplace platform with three user types:
- **Workers**: Browse and apply for jobs
- **Employers**: Post jobs and manage applications
- **Admins**: Manage platform and users

The frontend is built with:
- **React 19** with TypeScript
- **Vite** for fast development and builds
- **React Router v6** for navigation
- **TanStack Query** for data management
- **Zustand** for state management
- **Tailwind CSS** for styling

---

## Application Entry Flow

```
File System Entry → index.html
     ↓
src/main.tsx (React Application Bootstrap)
     ↓
Providers Stack (in order):
    1. React.StrictMode (Dev checks)
    2. QueryClientProvider (TanStack Query)
    3. BrowserRouter (React Router)
       ↓
       AuthProvider (Auth Context)
       ↓
       App.tsx Component
            ↓
            AuthContext Hook (Auth state)
            ↓
            AppRouter.tsx (Routing Configuration)
                ↓
                Layout Selection:
                  • RootLayout (Public pages)
                  • AuthLayout (Auth pages)
                  • DashboardLayout (Protected pages)
    4. ToastContainer (Notifications)
    5. ReactQueryDevtools (Dev tools)
```

### Key Entry File: src/main.tsx

```typescript
// Providers are applied in nesting order:
<QueryClientProvider>        // Data fetching & caching
  <BrowserRouter>            // Routing
    <AuthProvider>           // Auth state & context
      <App />                // Root component
      <ToastContainer />     // Notifications
    </AuthProvider>
  </BrowserRouter>
  <ReactQueryDevtools />     // Dev tools
</QueryClientProvider>
```

---

## Component Architecture

### Layout Components: `src/components/layout/`

```
layout/
├── index.tsx                    # Re-exports all layouts
├── RootLayout/RootLayout.tsx   # Public pages layout
├── AuthLayout/index.tsx        # Auth pages layout
├── DashboardLayout/
│   ├── Header.tsx             # Dashboard header
│   └── Sidebar.tsx            # Role-specific sidebar
├── Header/
│   ├── Header.tsx             # Main navigation header
│   ├── NavMenu.tsx            # Desktop navigation
│   ├── MobileMenu.tsx         # Mobile navigation
│   ├── useHeader.ts           # Header logic
│   └── Header.styles.ts       # Styled variants
└── Footer/Footer.tsx           # Global footer
```

**Public Page Layout (RootLayout)**:
```
RootLayout
├── Header (variant="public")   # "WorkForge" logo + Nav
├── <Outlet />                  # Page content
└── Footer                      # Links & social
```

**Auth Page Layout (AuthLayout)**:
```
AuthLayout
└── <Outlet />                  # Centered form (login/register)
```

**Dashboard Layout (DashboardLayout)**:
```
DashboardLayout
├── Sidebar                     # Role-specific navigation
├── Header (variant="dashboard") # Breadcrumb + user menu
└── <Outlet />                  # Page content
```

### Common Components: `src/components/common/`

Reusable utility components:
- `ErrorBoundary` - Error handling wrapper
- `FileUpload` - File upload with preview
- `JobStatusBadge` - Job status display
- `LoadingScreen` - Full-page loading state
- `LocationPicker` - Location selection component
- `MessageComposer` - Message input form
- `Pagination` - Pagination controls
- `ProtectedRoute` - Route protection wrapper
- `Rating` - Star rating display
- `RichTextEditor` - Rich text editing
- `SkillBadge` - Skill tag display
- `StripeProvider` + `PaymentElement` - Payment integration

### UI Components: `src/components/ui/`

Basic building blocks:
- `Button` - Button variants (primary, secondary, ghost)
- `Input` - Text input field
- `Modal` - Dialog modal
- `Card` - Container with elevation
- `Badge` - Status badges
- `Avatar` - User profile picture
- `Dropdown` - Dropdown menu
- `Table` - Data table
- `Tabs` - Tab panels
- `Select` - Select dropdown
- `Textarea` - Multi-line input
- `Toast` - Toast notifications
- `Tooltip` - Hover tooltips
- `Spinner` - Loading spinner
- `Skeleton` - Skeleton loader

---

## Routing System

### Route Structure: `src/routes/AppRouter.tsx`

```
Routes (from React Router)
│
├──────────────────────────────────────────────────────────
│ PUBLIC ROUTES (RootLayout)
├──────────────────────────────────────────────────────────
│
├─ / (Home)                      [Public, no auth required]
│  └─ Hero + Features + CTA
│
├─ /jobs                         [Public job listing]
├─ /jobs/:jobId                  [Public job details]
├─ /workers                       [Public worker search]
└─ /about                        [About page]
│
├──────────────────────────────────────────────────────────
│ AUTH ROUTES (AuthLayout)
├──────────────────────────────────────────────────────────
│
├─ /auth/login                   [Login form]
├─ /auth/register                [Registration form]
│  └─ ?role=worker|employer     [Pre-select role]
└─ /auth/forgot-password         [Password recovery]
│
├──────────────────────────────────────────────────────────
│ PROTECTED ROUTES (DashboardLayout)
├──────────────────────────────────────────────────────────
│
├─ /employer/* (EMPLOYER ONLY)
│  ├─ /employer/dashboard
│  ├─ /employer/jobs
│  ├─ /employer/jobs/:jobId
│  ├─ /employer/post-job
│  ├─ /employer/applications
│  ├─ /employer/workers
│  ├─ /employer/reviews
│  ├─ /employer/profile
│  └─ /employer/settings
│
├─ /worker/* (WORKER ONLY)
│  ├─ /worker/dashboard
│  ├─ /worker/jobs
│  ├─ /worker/applications
│  ├─ /worker/reviews
│  ├─ /worker/profile
│  └─ /worker/settings
│
├─ /admin/* (ADMIN ONLY)
│  ├─ /admin/dashboard
│  ├─ /admin/jobs
│  ├─ /admin/users
│  ├─ /admin/verifications
│  ├─ /admin/payments
│  └─ /admin/reports
│
├─ /messages                    (ALL AUTHENTICATED)
├─ /payments                    (ALL AUTHENTICATED)
│  ├─ /payments
│  ├─ /payments/:paymentId
│  └─ /payments/create
│
├─ /reviews                     (ALL AUTHENTICATED)
│  ├─ /reviews
│  └─ /reviews/create
│
└─ * (404)                      [Redirect to /]
```

### Route Protection

```typescript
// ProtectedDashboardLayout checks:
1. isLoading? → Show nothing (waiting for auth check)
2. !isAuthenticated? → Redirect to /auth/login
3. hasRole(allowedRoles)? → Allow access or redirect to /
4. Render DashboardLayout with content
```

---

## Page Organization

### Directory: `src/pages/`

```
pages/
├── admin/               [6 pages - Admin-only dashboard]
├── auth/               [3 pages - Authentication flows]
├── employer/           [9 pages - Employer features]
├── worker/             [6 pages - Worker features]
├── public/             [5 pages - Public content]
├── messages/           [1 page - Shared messaging]
├── payments/           [3 pages - Payment management]
└── reviews/            [2 pages - Review system]
```

### Each Page Folder Structure

```
PageName/
├── PageName.tsx        # Main component
├── index.ts           # Export for clean imports
├── components/        # Sub-components (optional)
│   ├── ComponentA.tsx
│   └── ComponentB.tsx
└── PageName.styles.ts # Styled variants (optional)
```

### Import Style

```typescript
// Good - Clean imports using index.ts
import { WorkerDashboard } from '@pages/worker/Dashboard';

// Used in AppRouter
const WorkerDashboard = lazy(() => import('@pages/worker/Dashboard/Dashboard'));
```

---

## User Journey

### New User Landing on Homepage

```
User visits workforge.app
        ↓
Load index.html (root div#root)
        ↓
Execute src/main.tsx
        ↓
Initialize providers (Query, Router, Auth)
        ↓
Load App.tsx
        ↓
Check AuthContext.isLoading
        ↓
Route to RootLayout (public)
        ↓
Load src/pages/public/Home/Home.tsx
        ↓
Render:
  ├─ Header (Logo + Nav + Sign In/Up buttons)
  ├─ Hero section
  ├─ Features
  ├─ How It Works
  ├─ Stats
  ├─ Testimonials
  ├─ CTA (Call-To-Action)
  │  └─ "Join as Worker" button → /auth/register?role=worker
  │  └─ "Join as Employer" button → /auth/register?role=employer
  └─ Footer
```

### User Registration Flow

```
Clicks "Join as Worker"
        ↓
Navigate to /auth/register?role=worker
        ↓
useSearchParams() detects ?role=worker
        ↓
Pre-fill role in form
        ↓
User fills form & submits
        ↓
authService.register(username, email, password, role)
        ↓
Backend creates User + Worker/Employer profile
        ↓
Show success toast
        ↓
Redirect to /auth/login
```

### User Login Flow

```
Clicks "Sign In" or form submit
        ↓
authService.login(email, password)
        ↓
Backend validates credentials
        ↓
Returns: { user, access_token, refresh_token }
        ↓
authStore.login() updates state
        ↓
get user.role
        ↓
Redirect based on role:
  ├─ WORKER → /worker/dashboard
  ├─ EMPLOYER → /employer/dashboard
  └─ ADMIN → /admin/dashboard
        ↓
DashboardLayout renders
        ↓
Sidebar shows role-specific menu
        ↓
Main content area shows dashboard
```

---

## File Structure

### Complete Folder Hierarchy

```
src/
├── main.tsx                # Entry point - Provider setup
├── App.tsx                 # Root component - Theme + Loading
├── index.css              # Global styles + Tailwind
│
├── routes/
│   └── AppRouter.tsx      # All route configurations
│
├── pages/                 # 35 feature pages
│   ├── admin/            # 6 pages
│   ├── auth/             # 3 pages
│   ├── employer/         # 9 pages
│   ├── worker/           # 6 pages
│   ├── public/           # 5 pages
│   ├── messages/         # 1 page
│   ├── payments/         # 3 pages
│   └── reviews/          # 2 pages
│
├── components/           # Reusable components
│   ├── layout/          # Page layouts (3 types)
│   ├── common/          # Utility components (12 types)
│   └── ui/              # Basic UI components (15 types)
│
├── context/
│   └── AuthContext.tsx   # Authentication provider
│
├── hooks/
│   └── useWorker.ts     # Data fetching hooks
│
├── services/
│   ├── auth.service.ts  # API calls
│   └── ...
│
├── store/
│   ├── auth.store.ts    # Zustand stores
│   └── ...
│
├── lib/
│   ├── api-client.ts    # Axios instance
│   └── utils/           # Helper functions
│
├── config/
│   └── endpoints.ts     # API endpoints
│
├── types/
│   └── index.ts         # TypeScript definitions
│
└── styles/
    └── ...              # Style utilities
```

---

## Best Practices

### 1. Component Imports

```typescript
// ✅ Good - Use path aliases and index files
import { Button } from '@components/ui/Button';
import { LoadingScreen } from '@components/common';
import { WorkerDashboard } from '@pages/worker/Dashboard';

// ❌ Avoid - Relative paths and deep imports
import { Button } from '../../../components/ui/Button/Button';
```

### 2. Layout Selection

```typescript
// RootLayout - Public pages
// Use for pages accessible without login
<Route element={<RootLayout />}>
  <Route index element={<HomePage />} />
</Route>

// AuthLayout - Auth pages
// Use for login, register, forgot password
<Route element={<AuthLayout />}>
  <Route path="/auth/login" element={<LoginPage />} />
</Route>

// DashboardLayout - Protected pages
// Use for authenticated user pages
<Route element={<ProtectedDashboardLayout allowedRoles={UserRole.WORKER} />}>
  <Route path="/worker/dashboard" element={<Dashboard />} />
</Route>
```

### 3. Page Structure

```typescript
// pages/worker/Dashboard/Dashboard.tsx
import { useAuth } from '@context/AuthContext';
import { useQuery } from '@tanstack/react-query';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['worker-stats', user?.id],
    queryFn: () => workerService.getStats(),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorState />;

  return <div>{/* Content */}</div>;
};

export default Dashboard;
```

### 4. Navigation Links

```typescript
// Use react-router Link for internal navigation
import { Link } from 'react-router-dom';

<Link to="/jobs">
  <Button>Browse Jobs</Button>
</Link>

// Navigation happens without page reload
// Uses React Router SPA routing
```

### 5. State Management

```typescript
// Auth State - From AuthContext
const { user, isAuthenticated, login, logout } = useAuth();

// UI State - From Zustand stores
const { theme, toggleTheme } = uiStore();

// Data State - From React Query
const { data, isLoading, error } = useQuery([...]);
```

---

## Summary

The WorkForge frontend follows a well-organized, modular architecture:

1. **Entry**: main.tsx → Providers → App.tsx → AppRouter.tsx
2. **Layouts**: RootLayout (public) → AuthLayout (auth) → DashboardLayout (protected)
3. **Pages**: 35 feature pages organized by role and feature
4. **Components**: 
   - Layout components (3)
   - Common utilities (12)
   - UI basics (15)
5. **Routing**: 60+ protected and public routes with role-based access
6. **State**: Auth context + Zustand stores + React Query
7. **Styling**: Tailwind CSS with custom variants

Everything is connected logically and systematically, ensuring:
- ✅ Clean imports and exports
- ✅ Clear separation of concerns
- ✅ Easy navigation and maintenance
- ✅ Type-safe development
- ✅ Scalable architecture
- ✅ Fast build and runtime performance
