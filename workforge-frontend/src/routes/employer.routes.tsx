import { Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

const EmployerDashboard = lazy(() => import('@pages/employer/Dashboard/Dashboard'));
const EmployerProfile = lazy(() => import('@pages/employer/Profile/Profile'));
const EmployerJobs = lazy(() => import('@pages/employer/Jobs/Jobs'));
const EmployerJobDetail = lazy(() => import('@pages/employer/JobDetail/JobDetail'));
const EmployerApplications = lazy(() => import('@pages/employer/Applications/Applications'));
const EmployerWorkers = lazy(() => import('@pages/employer/Workers/Workers'));
const EmployerReviews = lazy(() => import('@pages/employer/Reviews/Reviews'));
const EmployerSettings = lazy(() => import('@pages/employer/Settings/Settings'));
const EmployerPostJob = lazy(() => import('@pages/employer/PostJob/PostJob'));

export const EmployerRoutes = () => {
	return (
		<>
			<Route index element={<Navigate to="dashboard" replace />} />
			<Route path="dashboard" element={<EmployerDashboard />} />
			<Route path="profile" element={<EmployerProfile />} />
			<Route path="jobs">
				<Route index element={<EmployerJobs />} />
				<Route path=":jobId" element={<EmployerJobDetail />} />
			</Route>
			<Route path="post-job" element={<EmployerPostJob />} />
			<Route path="applications" element={<EmployerApplications />} />
			<Route path="workers" element={<EmployerWorkers />} />
			<Route path="reviews" element={<EmployerReviews />} />
			<Route path="settings" element={<EmployerSettings />} />
		</>
	);
};
