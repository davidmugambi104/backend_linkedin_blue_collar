import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';
import { Rating } from '@components/common/Rating/Rating';
import { Skeleton } from '@components/ui/Skeleton';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useEmployerJobs } from '@hooks/useEmployerJobs';
import { useJobApplications } from '@hooks/useEmployerApplications';
import { formatCurrency } from '@lib/utils/format';

export const TopApplicants: React.FC = () => {
  const { data: jobs } = useEmployerJobs();
  const firstJobId = jobs?.[0]?.id;
  
  const { data: applications, isLoading } = useJobApplications(firstJobId || 0);

  if (isLoading || !firstJobId) {
    return (
      <Card className="employer-bg-surface border employer-border rounded-2xl">
        <CardHeader>
          <h3 className="text-lg font-semibold employer-text-primary">Top Applicants</h3>
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

  const topApplicants = applications
    ?.filter(app => app.status === 'pending')
    .slice(0, 3) || [];

  return (
    <Card className="employer-bg-surface border employer-border rounded-2xl">
      <CardHeader>
        <h3 className="text-lg font-semibold employer-text-primary">Recent Applicants</h3>
        <Link to="/employer/applications">
          <Button variant="ghost" size="sm" className="employer-link-accent hover:underline">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {topApplicants.length === 0 ? (
            <p className="text-center employer-text-muted py-4">
              No applications yet
            </p>
          ) : (
            topApplicants.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between p-3 rounded-lg hover:employer-bg-muted transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={application.worker?.profile_picture}
                    name={application.worker?.full_name}
                    size="md"
                    className="rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium employer-text-primary">
                      {application.worker?.full_name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Rating value={application.worker?.average_rating || 0} readonly size="sm" />
                      <span className="text-xs employer-text-muted">
                        ({application.worker?.total_ratings})
                      </span>
                      {application.proposed_rate && (
                        <>
                          <span className="employer-text-muted">•</span>
                          <span className="text-xs employer-text-muted">
                            {formatCurrency(application.proposed_rate)}/hr
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Link to={`/employer/jobs/${application.job_id}?application=${application.id}`}>
                  <Button variant="ghost" size="sm" className="!p-2 employer-link-accent">
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};