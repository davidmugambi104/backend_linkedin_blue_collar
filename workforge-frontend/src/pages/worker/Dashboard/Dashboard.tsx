import React from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  CheckCircleIcon,
  StarIcon,
  PlusIcon,
  ArrowRightIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useWorkerStats, useRecommendedJobs } from '@hooks/useWorker';
import { useWorkerApplications } from '@hooks/useWorkerApplications';
import { useAuth } from '@context/AuthContext';
import { formatDate } from '@lib/utils/format';
import { formatCurrency } from '@lib/utils/format';
import { APPLICATION_STATUS } from '@config/constants';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useWorkerStats();
  const { data: applications, isLoading: appsLoading } = useWorkerApplications();
  const { data: recommendedJobs, isLoading: jobsLoading } = useRecommendedJobs();

  const recentApplications = applications?.slice(0, 5) || [];
  const topRecommendedJobs = recommendedJobs?.slice(0, 3) || [];

  const getStatusColor = (status: string) => {
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your job search today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-20" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Applications
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.total_applications || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3">
                  <BriefcaseIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Jobs Completed
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.completed_jobs || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Verification Score
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.verification_score || 0}%
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-3">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Rating
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.average_rating?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-3">
                  <StarIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to="/worker/jobs">
            <Button variant="outline" className="w-full justify-start">
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Browse Jobs
            </Button>
          </Link>
          <Link to="/worker/profile">
            <Button variant="outline" className="w-full justify-start">
              <PlusIcon className="h-5 w-5 mr-2" />
              Update Profile
            </Button>
          </Link>
          <Link to="/worker/applications">
            <Button variant="outline" className="w-full justify-start">
              <ClockIcon className="h-5 w-5 mr-2" />
              View Applications
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Applications
            </h2>
            <Link to="/worker/applications">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {appsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="text-center py-12">
              <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No applications yet
              </p>
              <Link to="/worker/jobs">
                <Button className="mt-4">Browse Jobs</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((application: any) => (
                <div
                  key={application.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {application.job?.title || 'Job Title'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {application.job?.employer?.company_name || 'Company'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Applied {formatDate(application.created_at)}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recommended Jobs */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recommended for You
            </h2>
            <Link to="/worker/jobs">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {jobsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : topRecommendedJobs.length === 0 ? (
            <div className="text-center py-12">
              <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No recommendations yet
              </p>
              <Link to="/worker/profile">
                <Button className="mt-4">Complete Your Profile</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {topRecommendedJobs.map((job: any) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {job.employer?.company_name || 'Company'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {job.address && (
                          <span className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {job.address}
                          </span>
                        )}
                        {job.pay_min && job.pay_max && (
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(job.pay_min)} - {formatCurrency(job.pay_max)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="default">{job.pay_type}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {job.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;