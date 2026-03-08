import React from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon, StarIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useEmployerApplications } from '@hooks/useEmployer';
import { formatDate } from '@lib/utils/format';

export const PendingReviews: React.FC = () => {
  const { data: applications = [] } = useEmployerApplications();

  const pendingApplications = applications
    .filter(app => app.status === 'pending')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <Card className="employer-bg-surface border employer-border rounded-2xl">
      <CardBody className="p-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="h-5 w-5 employer-text-accent" />
            <h3 className="text-lg font-semibold employer-text-primary">
              Pending Application Reviews
            </h3>
          </div>

          {pendingApplications.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 mx-auto employer-text-subtle mb-3" />
              <p className="employer-text-muted">
                No pending applications
              </p>
              <p className="text-sm employer-text-muted mt-1">
                All applications have been reviewed
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApplications.map((application) => (
                <Link
                  key={application.id}
                  to={`/employer/applications/${application.id}`}
                  className="block p-3 border employer-border rounded-lg hover:employer-bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold employer-text-primary">
                          {application.worker?.full_name || 'Applicant'}
                        </h4>
                        {application.worker?.average_rating && (
                          <div className="flex items-center gap-0.5">
                            <StarIcon className="h-4 w-4 text-yellow-400" />
                            <span className="text-xs font-medium employer-text-muted">
                              {application.worker.average_rating}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs employer-text-muted mt-1">
                        {application.job?.title || 'Job'}
                      </p>
                      <p className="text-xs employer-text-muted mt-1">
                        Applied {formatDate(application.created_at)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="employer-link-accent hover:underline">
                      Review
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {pendingApplications.length > 0 && (
            <div className="pt-3 border-t employer-border text-center">
              <p className="text-sm employer-text-muted">
                <span className="font-semibold employer-text-primary">
                  {pendingApplications.length}
                </span>
                {' '}pending review
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
