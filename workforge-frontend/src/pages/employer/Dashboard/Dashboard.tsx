import React from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  PlusIcon,
  ChartBarIcon,
  ArrowRightIcon,
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
  const recentApplications = applications.slice(0, 3) || [];
  const pendingApplicationsCount = applications.filter((app: any) => app.status === 'pending').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case JOB_STATUS.OPEN:
        return 'success';
      case JOB_STATUS.IN_PROGRESS:
        return 'info';
      case JOB_STATUS.COMPLETED:
        return 'purple';
      case JOB_STATUS.EXPIRED:
        return 'warning';
      case JOB_STATUS.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getApplicationStatusColor = (status: string) => {
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
        <h1 className="text-3xl font-bold text-[#0F172A]">
          Company Dashboard
        </h1>
        <p className="mt-2 text-[#64748B]">
          Manage your job postings and review applications
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-[#F8FAFC] rounded-2xl p-6">
                <Skeleton className="h-20 bg-[#F1F5F9]" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="bg-[#F8FAFC] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#64748B]">Active Jobs</p>
                  <p className="mt-2 text-3xl font-bold text-[#0F172A]">
                    {stats?.job_status_counts?.open || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-[#2563EB]/10 p-3">
                  <BriefcaseIcon className="h-8 w-8 text-[#2563EB]" />
                </div>
              </div>
            </Card>

            <Card className="bg-[#F8FAFC] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#64748B]">Total Applications</p>
                  <p className="mt-2 text-3xl font-bold text-[#0F172A]">
                    {stats?.total_applications || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-[#2563EB]/10 p-3">
                  <UsersIcon className="h-8 w-8 text-[#2563EB]" />
                </div>
              </div>
            </Card>

            <Card className="bg-[#F8FAFC] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#64748B]">Pending Review</p>
                  <p className="mt-2 text-3xl font-bold text-[#0F172A]">
                    {pendingApplicationsCount}
                  </p>
                </div>
                <div className="rounded-xl bg-[#2563EB]/10 p-3">
                  <ClockIcon className="h-8 w-8 text-[#2563EB]" />
                </div>
              </div>
            </Card>

            <Card className="bg-[#F8FAFC] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#64748B]">Total Jobs Posted</p>
                  <p className="mt-2 text-3xl font-bold text-[#0F172A]">
                    {stats?.total_jobs || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-[#2563EB]/10 p-3">
                  <ChartBarIcon className="h-8 w-8 text-[#2563EB]" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to="/employer/jobs/new">
            <Button className="w-full justify-start rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95">
              <PlusIcon className="h-5 w-5 mr-2" />
              Post New Job
            </Button>
          </Link>
          <Link to="/employer/applications">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Review Applications
            </Button>
          </Link>
          <Link to="/employer/workers">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Find Workers
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Job Postings */}
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0F172A]">Active Job Postings</h2>
            <Link to="/employer/jobs">
              <Button variant="ghost" size="sm" className="text-[#2563EB] hover:underline">
                View All
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {jobsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 bg-[#F1F5F9]" />
              ))}
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="text-center py-12">
              <BriefcaseIcon className="h-12 w-12 mx-auto text-[#94A3B8] mb-4" />
              <p className="text-[#64748B]">No active jobs</p>
              <Link to="/employer/jobs/new">
                <Button className="mt-4 rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Post Your First Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job: any) => (
                <Link
                  key={job.id}
                  to={`/employer/jobs/${job.id}`}
                  className="block border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#0F172A]">{job.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[#64748B]">
                        <span>Posted {formatDate(job.created_at)}</span>
                        <span className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {job.application_count || 0} applicants
                        </span>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Applications */}
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0F172A]">Recent Applications</h2>
            <Link to="/employer/applications">
              <Button variant="ghost" size="sm" className="text-[#2563EB] hover:underline">
                View All
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {appsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 bg-[#F1F5F9]" />
              ))}
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 mx-auto text-[#94A3B8] mb-4" />
              <p className="text-[#64748B]">No applications yet</p>
              <p className="text-sm text-[#64748B] mt-2">
                Post a job to start receiving applications
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((application: any) => (
                <Link
                  key={application.id}
                  to={`/employer/applications/${application.id}`}
                  className="block border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#0F172A]">
                        {application.worker?.full_name || 'Worker'}
                      </h3>
                      <p className="text-sm text-[#64748B] mt-1">
                        Applied for {application.job?.title || 'Job'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[#64748B]">
                        <span>{formatDate(application.created_at)}</span>
                      </div>
                    </div>
                    <Badge variant={getApplicationStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
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