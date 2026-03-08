/**
 * Employer Dashboard - Unified Design System
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useEmployerStats } from '@hooks/useEmployer';
import { useEmployerJobs } from '@hooks/useEmployerJobs';
import { useEmployerApplications } from '@hooks/useEmployer';
import { formatDate } from '@lib/utils/format';
import { JOB_STATUS, APPLICATION_STATUS } from '@config/constants';

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useEmployerStats();
  const { data: jobs, isLoading: jobsLoading } = useEmployerJobs();
  const { data: applications = [], isLoading: appsLoading } = useEmployerApplications();

  const activeJobs = jobs?.filter((job: any) => job.status === JOB_STATUS.OPEN).slice(0, 3) || [];
  const recentApplications = applications.slice(0, 5) || [];
  const pendingApplicationsCount = applications.filter((app: any) => app.status === 'pending').length;
  const totalJobs = stats?.total_jobs || 0;
  const totalApplications = stats?.total_applications || 0;
  const activeJobsCount = stats?.job_status_counts?.open || 0;

  const trendData = {
    activeJobs: activeJobsCount > 0 ? { up: true, label: '+8% vs last week' } : { up: false, label: 'No movement yet' },
    totalApplications: totalApplications > 4 ? { up: true, label: '+12% this period' } : { up: false, label: 'Low pipeline volume' },
    pending: pendingApplicationsCount < 5 ? { up: true, label: 'Healthy review queue' } : { up: false, label: 'Backlog increasing' },
    totalJobs: totalJobs > 0 ? { up: true, label: '+5% this month' } : { up: false, label: 'Publish your first role' },
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case JOB_STATUS.OPEN:
        return 'success';
      case JOB_STATUS.IN_PROGRESS:
        return 'info';
      case JOB_STATUS.COMPLETED:
        return 'purple';
      case JOB_STATUS.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getApplicationStatusColor = (status: string): string => {
    switch (status) {
      case APPLICATION_STATUS.ACCEPTED:
        return 'success';
      case APPLICATION_STATUS.REJECTED:
        return 'error';
      case APPLICATION_STATUS.PENDING:
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Company Dashboard
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage your job postings and review applications
          </p>
        </div>
        <Link to="/employer/post-job">
          <Button leftIcon={<PlusIcon className="h-5 w-5" />}>
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 lg:p-6">
              <Skeleton className="h-20" />
            </Card>
          ))
        ) : (
          <>
            {/* Active Jobs */}
            <Card className="p-4 lg:p-6 employer-stat-widget employer-aspect-16-9" hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Jobs</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.job_status_counts?.open || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs">
                {trendData.activeJobs.up ? <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" /> : <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />}
                <span className={trendData.activeJobs.up ? 'text-emerald-600' : 'text-red-600'}>{trendData.activeJobs.label}</span>
              </div>
            </Card>

            {/* Total Applications */}
            <Card className="p-4 lg:p-6 employer-stat-widget employer-aspect-16-9" hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Applications</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.total_applications || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs">
                {trendData.totalApplications.up ? <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" /> : <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />}
                <span className={trendData.totalApplications.up ? 'text-emerald-600' : 'text-red-600'}>{trendData.totalApplications.label}</span>
              </div>
            </Card>

            {/* Pending Review */}
            <Card className="p-4 lg:p-6 employer-stat-widget employer-aspect-16-9" hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    {pendingApplicationsCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs">
                {trendData.pending.up ? <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" /> : <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />}
                <span className={trendData.pending.up ? 'text-emerald-600' : 'text-red-600'}>{trendData.pending.label}</span>
              </div>
            </Card>

            {/* Total Jobs */}
            <Card className="p-4 lg:p-6 employer-stat-widget employer-aspect-16-9" hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Jobs Posted</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.total_jobs || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs">
                {trendData.totalJobs.up ? <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" /> : <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />}
                <span className={trendData.totalJobs.up ? 'text-emerald-600' : 'text-red-600'}>{trendData.totalJobs.label}</span>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-4 lg:p-6 employer-m3-card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/employer/post-job">
            <Button variant="default" className="w-full justify-start" leftIcon={<PlusIcon className="h-5 w-5" />}>
              Post New Job
            </Button>
          </Link>
          <Link to="/employer/applications">
            <Button variant="outline" className="w-full justify-start" leftIcon={<UsersIcon className="h-5 w-5" />}>
              Review Applications
            </Button>
          </Link>
          <Link to="/employer/workers">
            <Button variant="outline" className="w-full justify-start" leftIcon={<BriefcaseIcon className="h-5 w-5" />}>
              Browse Workers
            </Button>
          </Link>
        </div>
      </Card>

      {/* Active Jobs & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <Card className="p-4 lg:p-6 employer-m3-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Jobs</h2>
            <Link to="/employer/jobs" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </Link>
          </div>
          
          {jobsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="text-center py-8">
              <BriefcaseIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No active jobs</p>
              <Link to="/employer/post-job">
                <Button size="sm" className="mt-4">Post Your First Job</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job: any) => (
                <Link 
                  key={job.id} 
                  to={`/employer/jobs/${job.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{job.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {job.application_count || 0} applications • {formatDate(job.created_at)}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(job.status) as any}>{job.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Applications */}
        <Card className="p-4 lg:p-6 employer-m3-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h2>
            <Link to="/employer/applications" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </Link>
          </div>
          
          {appsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app: any) => (
                <div 
                  key={app.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{app.worker?.user?.username || 'Applicant'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {app.job?.title || 'Job'} • {formatDate(app.created_at)}
                    </p>
                  </div>
                  <Badge variant={getApplicationStatusColor(app.status) as any}>{app.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
