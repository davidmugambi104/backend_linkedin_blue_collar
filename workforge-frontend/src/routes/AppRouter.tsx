import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RootLayout } from '@components/layout/RootLayout';
import { AuthLayout } from '@components/layout/AuthLayout';
import { DashboardLayout } from '@components/layout/DashboardLayout';
import { useAuth } from '@context/AuthContext';
import { UserRole } from '@types';
import { LoadingScreen } from '@components/common/LoadingScreen';

/**
 * LAZY LOADED COMPONENTS - PUBLIC PAGES
 * Routes: /, /jobs, /jobs/:jobId, /workers, /workers/:workerId, /about
 */
const HomePage = lazy(() => import('@pages/public/Home/Home'));
const JobsPage = lazy(() => import('@pages/public/Jobs/Jobs'));
const JobDetailPage = lazy(() => import('@pages/public/JobDetail/JobDetail'));
const WorkersPage = lazy(() => import('@pages/public/Workers/Workers'));
const AboutPage = lazy(() => import('@pages/public/About/About'));
const NotFoundPage = lazy(() => import('@pages/public/NotFound/NotFound'));

/**
 * LAZY LOADED COMPONENTS - AUTH PAGES
 * Routes: /auth/login, /auth/register, /auth/forgot-password
 */
const LoginPage = lazy(() => import('@pages/auth/Login/Login'));
const RegisterPage = lazy(() => import('@pages/auth/Register/Register'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPassword/ForgotPassword'));

/**
 * LAZY LOADED COMPONENTS - EMPLOYER PAGES
 * Routes: /employer/* (10 pages)
 */
const EmployerDashboard = lazy(() => import('@pages/employer/Dashboard/Dashboard'));
const EmployerProfile = lazy(() => import('@pages/employer/Profile/Profile'));
const EmployerJobs = lazy(() => import('@pages/employer/Jobs/Jobs'));
const EmployerJobDetail = lazy(() => import('@pages/employer/Applications/EmployerJobDetail'));
const EmployerJobDetailPreview = lazy(() => import('@pages/employer/JobDetail/JobDetail'));
const EmployerApplications = lazy(() => import('@pages/employer/Applications/Applications'));
const EmployerWorkers = lazy(() => import('@pages/employer/Workers/Workers'));
const EmployerReviews = lazy(() => import('@pages/employer/Reviews/Reviews'));
const EmployerSettings = lazy(() => import('@pages/employer/Settings/Settings'));
const EmployerPostJob = lazy(() => import('@pages/employer/PostJob/PostJob'));

/**
 * LAZY LOADED COMPONENTS - WORKER PAGES
 * Routes: /worker/* (6 pages)
 */
const WorkerDashboard = lazy(() => import('@pages/worker/Dashboard/Dashboard'));
const WorkerProfile = lazy(() => import('@pages/worker/Profile/Profile'));
const WorkerJobs = lazy(() => import('@pages/worker/Jobs/Jobs'));
const WorkerApplications = lazy(() => import('@pages/worker/Applications/Applications'));
const WorkerReviews = lazy(() => import('@pages/worker/Reviews/Reviews'));
const WorkerSettings = lazy(() => import('@pages/worker/Settings/Settings'));

/**
 * LAZY LOADED COMPONENTS - ADMIN PAGES
 * Routes: /admin/* (6 pages)
 */
const AdminDashboard = lazy(() => import('@pages/admin/Dashboard/Dashboard'));
const AdminJobs = lazy(() => import('@pages/admin/Jobs/Jobs'));
const AdminUsers = lazy(() => import('@pages/admin/Users/Users'));
const AdminVerifications = lazy(() => import('@pages/admin/Verifications/Verifications'));
const AdminPayments = lazy(() => import('@pages/admin/Payments/Payments'));
const AdminReports = lazy(() => import('@pages/admin/Reports/Reports'));
const AdminSettings = lazy(() => import('@pages/admin/Settings/Settings'));

/**
 * LAZY LOADED COMPONENTS - SHARED PAGES
 * Routes: /messages, /payments, /reviews (6 pages)
 */
const Inbox = lazy(() => import('@pages/messages/Inbox/Inbox'));
const PaymentList = lazy(() => import('@pages/payments/PaymentList/PaymentList'));
const PaymentDetail = lazy(() => import('@pages/payments/PaymentDetail/PaymentDetail'));
const CreatePayment = lazy(() => import('@pages/payments/CreatePayment/CreatePayment'));
const ReviewList = lazy(() => import('@pages/reviews/ReviewList/ReviewList'));
const CreateReview = lazy(() => import('@pages/reviews/CreateReview/CreateReview'));

/**
 * PROTECTED DASHBOARD LAYOUT WRAPPER
 * Checks authentication status and user role before rendering DashboardLayout
 * @param allowedRoles - Array of roles allowed to access the routes within
 */
const ProtectedDashboardLayout = ({
  allowedRoles,
}: {
  allowedRoles?: UserRole | UserRole[];
}) => {
  const { isAuthenticated, hasRole, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/auth/login" state={{ from: location }} replace />
    );
  }

  // Check role if allowedRoles is specified
  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout />;
};

/**
 * SUSPENSION FALLBACK
 * Shown while lazy components are loading
 */
const SuspenseFallback = () => <LoadingScreen />;

/**
 * APP ROUTER - Complete routing configuration for WorkForge
 * 
 * ROUTE SUMMARY:
 * - Public Routes (5): Home, Jobs, JobDetail, Workers, About
 * - Auth Routes (3): Login, Register, ForgotPassword
 * - Employer Routes (9): Dashboard, Profile, Jobs, JobDetail, PostJob, Applications, Workers, Reviews, Settings
 * - Worker Routes (6): Dashboard, Profile, Jobs, Applications, Reviews, Settings
 * - Admin Routes (6): Dashboard, Jobs, Users, Verifications, Payments, Reports
 * - Shared Routes (6): Messages, PaymentList, PaymentDetail, CreatePayment, ReviewList, CreateReview
 * - Catch-all: NotFound (404)
 * 
 * TOTAL: 35+ pages, 60+ routes
 */
export const AppRouter = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        {/* ========================================
            PUBLIC ROUTES - No authentication required
            Layout: RootLayout (with Header & Footer)
            ======================================== */}
        <Route element={<RootLayout />}>
          {/* Home Page */}
          <Route index element={<HomePage />} />

          {/* Jobs Section */}
          <Route path="jobs">
            <Route index element={<JobsPage />} />
            <Route path=":jobId" element={<JobDetailPage />} />
          </Route>

          {/* Workers Section */}
          <Route path="workers">
            <Route index element={<WorkersPage />} />
            {/* Individual worker profile - placeholder for future */}
            <Route path=":workerId" element={<div>Worker Profile Detail (TODO)</div>} />
          </Route>

          {/* About Page */}
          <Route path="about" element={<AboutPage />} />
        </Route>

        {/* ========================================
            AUTHENTICATION ROUTES
            Layout: AuthLayout (minimal, centered)
            ======================================== */}
        <Route element={<AuthLayout />}>
          <Route path="auth">
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        {/* ========================================
            EMPLOYER ROUTES
            Layout: DashboardLayout
            Protection: EMPLOYER role required
            ======================================== */}
        <Route
          path="employer"
          element={
            <ProtectedDashboardLayout allowedRoles={UserRole.EMPLOYER} />
          }
        >
          {/* Redirect /employer to /employer/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<EmployerDashboard />} />

          {/* Profile */}
          <Route path="profile" element={<EmployerProfile />} />

          {/* Jobs Management */}
          <Route path="jobs">
            <Route index element={<EmployerJobs />} />
            <Route path="post" element={<EmployerPostJob />} />
            <Route path=":jobId" element={<EmployerJobDetail />} />
            <Route path=":jobId/preview" element={<EmployerJobDetailPreview />} />
          </Route>

          {/* Post New Job */}
          <Route path="post-job" element={<EmployerPostJob />} />

          {/* Applications */}
          <Route path="applications" element={<EmployerApplications />} />

          {/* Workers Directory */}
          <Route path="workers" element={<EmployerWorkers />} />

          {/* Reviews */}
          <Route path="reviews" element={<EmployerReviews />} />

          {/* Settings */}
          <Route path="settings" element={<EmployerSettings />} />
        </Route>

        {/* ========================================
            WORKER ROUTES
            Layout: DashboardLayout
            Protection: WORKER role required
            ======================================== */}
        <Route
          path="worker"
          element={<ProtectedDashboardLayout allowedRoles={UserRole.WORKER} />}
        >
          {/* Redirect /worker to /worker/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<WorkerDashboard />} />

          {/* Profile */}
          <Route path="profile" element={<WorkerProfile />} />

          {/* Jobs Search & Browse */}
          <Route path="jobs" element={<WorkerJobs />} />

          {/* My Applications */}
          <Route path="applications" element={<WorkerApplications />} />

          {/* My Reviews */}
          <Route path="reviews" element={<WorkerReviews />} />

          {/* Settings */}
          <Route path="settings" element={<WorkerSettings />} />
        </Route>

        {/* ========================================
            ADMIN ROUTES
            Layout: DashboardLayout
            Protection: ADMIN role required
            ======================================== */}
        <Route
          path="admin"
          element={<ProtectedDashboardLayout allowedRoles={UserRole.ADMIN} />}
        >
          {/* Redirect /admin to /admin/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard - Platform Overview */}
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Jobs Management */}
          <Route path="jobs" element={<AdminJobs />} />

          {/* Users Management */}
          <Route path="users" element={<AdminUsers />} />

          {/* Verifications Queue */}
          <Route path="verifications" element={<AdminVerifications />} />

          {/* Payments & Disputes */}
          <Route path="payments" element={<AdminPayments />} />

          {/* Platform Reports */}
          <Route path="reports" element={<AdminReports />} />

          {/* Platform Settings */}
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* ========================================
            SHARED ROUTES
            Layout: DashboardLayout
            Protection: All authenticated users
            Accessible by: Worker, Employer, Admin
            ======================================== */}
        <Route element={<ProtectedDashboardLayout />}>
          {/* Messaging - Inbox */}
          <Route path="messages" element={<Inbox />} />

          {/* Payments - All users can view/manage payments */}
          <Route path="payments">
            <Route index element={<PaymentList />} />
            <Route path=":paymentId" element={<PaymentDetail />} />
            <Route path="create" element={<CreatePayment />} />
          </Route>

          {/* Reviews - All users can view/create reviews */}
          <Route path="reviews">
            <Route index element={<ReviewList />} />
            <Route path="create" element={<CreateReview />} />
          </Route>
        </Route>

        {/* ========================================
            404 NOT FOUND - Catch-all route
            This must be last to catch all unmatched routes
            ======================================== */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};