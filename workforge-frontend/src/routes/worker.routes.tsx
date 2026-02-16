import { Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

const WorkerDashboard = lazy(() => import('@pages/worker/Dashboard/Dashboard'));
const WorkerProfile = lazy(() => import('@pages/worker/Profile/Profile'));
const WorkerJobs = lazy(() => import('@pages/worker/Jobs/Jobs'));
const WorkerApplications = lazy(() => import('@pages/worker/Applications/Applications'));
const WorkerReviews = lazy(() => import('@pages/worker/Reviews/Reviews'));
const WorkerSettings = lazy(() => import('@pages/worker/Settings/Settings'));

export const WorkerRoutes = () => {
	return (
		<>
			<Route index element={<Navigate to="dashboard" replace />} />
			<Route path="dashboard" element={<WorkerDashboard />} />
			<Route path="profile" element={<WorkerProfile />} />
			<Route path="jobs" element={<WorkerJobs />} />
			<Route path="applications" element={<WorkerApplications />} />
			<Route path="reviews" element={<WorkerReviews />} />
			<Route path="settings" element={<WorkerSettings />} />
		</>
	);
};
