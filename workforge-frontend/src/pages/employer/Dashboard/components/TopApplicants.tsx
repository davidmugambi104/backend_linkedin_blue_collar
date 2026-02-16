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
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
        <CardHeader>
          <h3 className="text-lg font-semibold text-[#0F172A]">Top Applicants</h3>
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

  const topApplicants = applications
    ?.filter(app => app.status === 'pending')
    .slice(0, 3) || [];

  return (
    <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
      <CardHeader>
        <h3 className="text-lg font-semibold text-[#0F172A]">Recent Applicants</h3>
        <Link to="/employer/applications">
          <Button variant="ghost" size="sm" className="text-[#2563EB] hover:underline">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {topApplicants.length === 0 ? (
            <p className="text-center text-[#64748B] py-4">
              No applications yet
            </p>
          ) : (
            topApplicants.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={application.worker?.profile_picture}
                    name={application.worker?.full_name}
                    size="md"
                    className="rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium text-[#0F172A]">
                      {application.worker?.full_name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Rating value={application.worker?.average_rating || 0} readonly size="sm" />
                      <span className="text-xs text-[#64748B]">
                        ({application.worker?.total_ratings})
                      </span>
                      {application.proposed_rate && (
                        <>
                          <span className="text-[#E2E8F0]">•</span>
                          <span className="text-xs text-[#64748B]">
                            {formatCurrency(application.proposed_rate)}/hr
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Link to={`/employer/jobs/${application.job_id}?application=${application.id}`}>
                  <Button variant="ghost" size="sm" className="!p-2 text-[#2563EB]">
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