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
    <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
      <CardBody className="p-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="h-5 w-5 text-[#2563EB]" />
            <h3 className="text-lg font-semibold text-[#0F172A]">
              Pending Application Reviews
            </h3>
          </div>

          {pendingApplications.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 mx-auto text-[#94A3B8] mb-3" />
              <p className="text-[#64748B]">
                No pending applications
              </p>
              <p className="text-sm text-[#64748B] mt-1">
                All applications have been reviewed
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApplications.map((application) => (
                <Link
                  key={application.id}
                  to={`/employer/applications/${application.id}`}
                  className="block p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[#0F172A]">
                          {application.worker?.full_name || 'Applicant'}
                        </h4>
                        {application.worker?.average_rating && (
                          <div className="flex items-center gap-0.5">
                            <StarIcon className="h-4 w-4 text-yellow-400" />
                            <span className="text-xs font-medium text-[#64748B]">
                              {application.worker.average_rating}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">
                        {application.job?.title || 'Job'}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">
                        Applied {formatDate(application.created_at)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#2563EB] hover:underline">
                      Review
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {pendingApplications.length > 0 && (
            <div className="pt-3 border-t border-[#E2E8F0] text-center">
              <p className="text-sm text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">
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
