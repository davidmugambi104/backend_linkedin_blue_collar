import { Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

const AdminDashboard = lazy(() => import('@pages/admin/Dashboard/Dashboard'));
const AdminJobs = lazy(() => import('@pages/admin/Jobs/Jobs'));
const AdminUsers = lazy(() => import('@pages/admin/Users/Users'));
const AdminVerifications = lazy(() => import('@pages/admin/Verifications/VerificationQueue'));
const AdminPayments = lazy(() => import('@pages/admin/Payments/Payments'));
const AdminReports = lazy(() => import('@pages/admin/Reports/Reports'));
const AdminDisputes = lazy(() => import('@pages/admin/Disputes/Disputes'));

export const AdminRoutes = () => {
	return (
		<>
			<Route index element={<Navigate to="dashboard" replace />} />
			<Route path="dashboard" element={<AdminDashboard />} />
			<Route path="jobs" element={<AdminJobs />} />
			<Route path="users" element={<AdminUsers />} />
			<Route path="verifications" element={<AdminVerifications />} />
			<Route path="disputes" element={<AdminDisputes />} />
			<Route path="payments" element={<AdminPayments />} />
			<Route path="reports" element={<AdminReports />} />
		</>
	);
};
