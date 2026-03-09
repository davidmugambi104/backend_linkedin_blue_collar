import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useWorkerApplications } from '@hooks/useWorkerApplications';
import { ApplicationStatus } from '@types';

const statusColors: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: 'warning',
  [ApplicationStatus.ACCEPTED]: 'success',
  [ApplicationStatus.REJECTED]: 'error',
  [ApplicationStatus.WITHDRAWN]: 'default',
};

export const RecentApplications: React.FC = () => {
  const { data: applications, isLoading } = useWorkerApplications();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Applications</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  const recentApplications = applications?.slice(0, 5) || [];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Recent Applications</h3>
        <Link to="/worker/applications">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4" />}>
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {recentApplications.length === 0 ? (
            <p className="text-center text-slate-500  py-4">
              No applications yet. Start applying to jobs!
            </p>
          ) : (
            recentApplications.map((application) => (
              <Link
                key={application.id}
                to={application.job_id ? `/jobs/${application.job_id}` : '/worker/applications'}
                className="block p-4 rounded-lg hover:bg-gray-50 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar
                      name={application.job?.employer?.company_name}
                      size="sm"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 text-[#1A1A1A]">
                        {application.job?.title}
                      </h4>
                      <p className="text-sm text-slate-500 ">
                        {application.job?.employer?.company_name}
                      </p>
                      <p className="text-xs text-slate-400 text-slate-500 mt-1">
                        Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={statusColors[application.status] as any}
                    size="sm"
                  >
                    {application.status}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};