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
      <Card className="employer-bg-surface border employer-border rounded-2xl">
        <CardHeader>
          <h3 className="text-lg font-semibold employer-text-primary">Recent Job Postings</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 employer-bg-muted" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  const recentJobs = jobs?.slice(0, 5) || [];

  return (
    <Card className="employer-bg-surface border employer-border rounded-2xl">
      <CardHeader>
        <h3 className="text-lg font-semibold employer-text-primary">Recent Job Postings</h3>
        <Link to="/employer/jobs">
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            className="employer-link-accent hover:underline"
          >
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="employer-text-muted mb-4">
                You haven't posted any jobs yet
              </p>
              <Link to="/employer/post-job">
                <Button className="rounded-xl employer-button-primary shadow-sm active:scale-95">
                  Post Your First Job
                </Button>
              </Link>
            </div>
          ) : (
            recentJobs.map((job) => (
              <Link
                key={job.id}
                to={`/employer/jobs/${job.id}`}
                className="block p-4 rounded-lg hover:employer-bg-muted transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium employer-text-primary">
                        {job.title}
                      </h4>
                      <JobStatusBadge status={job.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm employer-text-muted">
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