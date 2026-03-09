/**
 * Worker Dashboard - Unified Design System
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  CheckCircleIcon,
  StarIcon,
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useWorkerStats, useRecommendedJobs } from '@hooks/useWorker';
import { useWorkerApplications } from '@hooks/useWorkerApplications';
import { useAuth } from '@context/AuthContext';
import { formatDate, formatCurrency } from '@lib/utils/format';
import { APPLICATION_STATUS } from '@config/constants';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useWorkerStats();
  const { data: applications, isLoading: appsLoading } = useWorkerApplications();
  const { data: recommendedJobs, isLoading: jobsLoading } = useRecommendedJobs();

  const recentApplications = applications?.slice(0, 5) || [];
  const topRecommendedJobs = recommendedJobs?.slice(0, 3) || [];
  const pendingApplicationsCount = stats?.application_status_counts?.[APPLICATION_STATUS.PENDING] || 0;
  const acceptedApplicationsCount = stats?.application_status_counts?.[APPLICATION_STATUS.ACCEPTED] || 0;
  const profileCompleted = !!stats?.verification_status;

  const getStatusColor = (status: string): string => {
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

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case APPLICATION_STATUS.ACCEPTED:
        return <CheckCircleIcon className="h-5 w-5" />;
      case APPLICATION_STATUS.REJECTED:
        return <BriefcaseIcon className="h-5 w-5" />;
      case APPLICATION_STATUS.PENDING:
        return <ClockIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1A1A]">
            Welcome back, {user?.username || 'Worker'}!
          </h1>
          <p className="mt-1 text-slate-500">
            Track your applications and discover new opportunities
          </p>
        </div>
        <Link to="/worker/jobs">
          <Button leftIcon={<BriefcaseIcon className="h-5 w-5" />}>
            Browse Jobs
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
            {/* Total Applications */}
            <Card className="p-4 lg:p-6" hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 ">Total Applications</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
                    {stats?.total_applications || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 bg-blue-900/30 flex items-center justify-center">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600 text-blue-400" />
                </div>
              </div>
            </Card>

            {/* Pending Applications */}
            <Card className="p-4 lg:p-6" hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 ">Pending</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
                    {pendingApplicationsCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 bg-amber-900/30 flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-amber-600 text-amber-400" />
                </div>
              </div>
            </Card>

            {/* Accepted */}
            <Card className="p-4 lg:p-6" hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 ">Accepted</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
                    {acceptedApplicationsCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 bg-green-900/30 flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 text-green-400" />
                </div>
              </div>
            </Card>

            {/* Average Rating */}
            <Card className="p-4 lg:p-6" hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 ">Average Rating</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
                    {stats?.average_rating?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 bg-purple-900/30 flex items-center justify-center">
                  <StarIcon className="h-6 w-6 text-purple-600 text-purple-400" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <Card className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 text-[#1A1A1A]">Recent Applications</h2>
            <Link to="/worker/applications" className="text-sm text-blue-600 text-blue-400 hover:underline">
              View All
            </Link>
          </div>
          
          {appsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <BriefcaseIcon className="h-12 w-12 text-slate-300 text-gray-600 mx-auto mb-3" />
              <p className="text-slate-500 ">No applications yet</p>
              <Link to="/worker/jobs">
                <Button size="sm" className="mt-4">Find Your First Job</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app: any) => (
                <Link 
                  key={app.id} 
                  to={app.job_id ? `/jobs/${app.job_id}` : '/worker/applications'}
                  className="block p-3 rounded-lg hover:bg-gray-50 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-[#1A1A1A] truncate">{app.job?.title || 'Job'}</h3>
                      <p className="text-sm text-slate-500 ">
                        {app.employer?.company_name || 'Employer'} • {formatDate(app.created_at)}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(app.status) as any} className="flex items-center gap-1">
                      {getStatusIcon(app.status)}
                      {app.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recommended Jobs */}
        <Card className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 text-[#1A1A1A]">Recommended Jobs</h2>
            <Link to="/worker/jobs" className="text-sm text-blue-600 text-blue-400 hover:underline">
              View All
            </Link>
          </div>
          
          {jobsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : topRecommendedJobs.length === 0 ? (
            <div className="text-center py-8">
              <StarIcon className="h-12 w-12 text-slate-300 text-gray-600 mx-auto mb-3" />
              <p className="text-slate-500 ">No recommendations yet</p>
              <p className="text-sm text-slate-400 text-slate-500 mt-1">Complete your profile to get personalized job suggestions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topRecommendedJobs.map((job: any) => (
                <Link 
                  key={job.id} 
                  to={`/jobs/${job.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-[#1A1A1A] truncate">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500 ">
                        {job.address && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {job.address}
                          </span>
                        )}
                        {job.pay_min && job.pay_max && (
                          <span className="flex items-center gap-1 font-medium text-green-600 text-green-400">
                            <CurrencyDollarIcon className="h-3.5 w-3.5" />
                            {formatCurrency(job.pay_min)} - {formatCurrency(job.pay_max)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Apply</Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Profile Completion Prompt */}
      {!profileCompleted && (
        <Card className="p-4 lg:p-6 bg-blue-50 bg-blue-900/20 border-blue-200 border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <StarIcon className="h-6 w-6 text-blue-600 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-[#1A1A1A]">Complete Your Profile</h3>
              <p className="mt-1 text-sm text-gray-600 ">
                Add your skills and verify your profile to get more job recommendations and increase your chances of being hired.
              </p>
              <Link to="/worker/profile">
                <Button size="sm" className="mt-4">Update Profile</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
