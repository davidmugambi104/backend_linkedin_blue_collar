import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useEmployerJobs } from '@hooks/useEmployerJobs';
import { JobStatusBadge } from '@components/common/JobStatusBadge';

export const RecentJobPostings: React.FC = () => {
  const { data: jobs, isLoading } = useEmployerJobs();

  if (isLoading) {
    return (
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
        <CardHeader>
          <h3 className="text-lg font-semibold text-[#0F172A]">Recent Job Postings</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 bg-[#F1F5F9]" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  const recentJobs = jobs?.slice(0, 5) || [];

  return (
    <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
      <CardHeader>
        <h3 className="text-lg font-semibold text-[#0F172A]">Recent Job Postings</h3>
        <Link to="/employer/jobs">
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            className="text-[#2563EB] hover:underline"
          >
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#64748B] mb-4">
                You haven't posted any jobs yet
              </p>
              <Link to="/employer/post-job">
                <Button className="rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95">
                  Post Your First Job
                </Button>
              </Link>
            </div>
          ) : (
            recentJobs.map((job) => (
              <Link
                key={job.id}
                to={`/employer/jobs/${job.id}`}
                className="block p-4 rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-[#0F172A]">
                        {job.title}
                      </h4>
                      <JobStatusBadge status={job.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-[#64748B]">
                      <span>{job.application_count || 0} applications</span>
                      <span>•</span>
                      <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {job.application_count && job.application_count > 0 && (
                    <Badge variant="info" size="sm" className="ml-4 bg-blue-50 text-blue-600">
                      {job.application_count} new
                    </Badge>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};