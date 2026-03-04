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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="mt-2 text-slate-600">
          Here's what's happening with your job search today
        </p>
      </div>

      {/* Stats Grid - Professional Blue/White Theme */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft">
                <Skeleton className="h-20" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Applications
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats?.total_applications || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-primary-500/10 p-3 border border-primary-500/20">
                  <BriefcaseIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Jobs Completed
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats?.completed_jobs || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-success-500/10 p-3 border border-success-500/20">
                  <CheckCircleIcon className="h-8 w-8 text-success-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Verification Score
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats?.verification_score || 0}%
                  </p>
                </div>
                <div className="rounded-xl bg-primary-500/10 p-3 border border-primary-500/20">
                  <CheckCircleIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Average Rating
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats?.average_rating?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div className="rounded-xl bg-warning-500/10 p-3 border border-warning-500/20">
                  <StarIcon className="h-8 w-8 text-warning-600" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to="/worker/jobs">
            <Button variant="outline" className="w-full justify-start border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300">
              <BriefcaseIcon className="h-5 w-5 mr-2 text-primary-600" />
              Browse Jobs
            </Button>
          </Link>
          <Link to="/worker/profile">
            <Button variant="outline" className="w-full justify-start border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300">
              <PlusIcon className="h-5 w-5 mr-2 text-primary-600" />
              Update Profile
            </Button>
          </Link>
          <Link to="/worker/applications">
            <Button variant="outline" className="w-full justify-start border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300">
              <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
              View Applications
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Applications
            </h2>
            <Link to="/worker/applications">
              <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
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
              <BriefcaseIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">
                No applications yet
              </p>
              <Link to="/worker/jobs">
                <Button className="mt-4 bg-primary-600 hover:bg-primary-700 text-white shadow-soft">Browse Jobs</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((application: any) => (
                <div
                  key={application.id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-primary-400 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {application.job?.title || 'Job Title'}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {application.job?.employer?.company_name || 'Company'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
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
        <Card className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recommended for You
            </h2>
            <Link to="/worker/jobs">
              <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
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
              <BriefcaseIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">
                No recommendations yet
              </p>
              <Link to="/worker/profile">
                <Button className="mt-4 bg-primary-600 hover:bg-primary-700 text-white shadow-soft">Complete Your Profile</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {topRecommendedJobs.map((job: any) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block border border-slate-200 rounded-xl p-4 hover:border-primary-400 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {job.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {job.employer?.company_name || 'Company'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        {job.address && (
                          <span className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {job.address}
                          </span>
                        )}
                        {job.pay_min && job.pay_max && (
                          <span className="font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-lg">
                            {formatCurrency(job.pay_min)} - {formatCurrency(job.pay_max)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="default" className="bg-primary-500 text-white border-none">{job.pay_type}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 line-clamp-2">
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