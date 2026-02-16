import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { JobStatusBadge } from '@components/common/JobStatusBadge';
import { Application, ApplicationStatus } from '@types';
import { formatCurrency } from '@lib/utils/format';
import { 
  ArrowTopRightOnSquareIcon, 
  XMarkIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface ApplicationCardProps {
  application: Application;
  onWithdraw?: (id: number) => void;
  onView?: (id: number) => void;
}

const statusColors: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: 'warning',
  [ApplicationStatus.ACCEPTED]: 'success',
  [ApplicationStatus.REJECTED]: 'error',
  [ApplicationStatus.WITHDRAWN]: 'default',
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onWithdraw,
  onView,
}) => {
  const canWithdraw = application.status === ApplicationStatus.PENDING;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar
              name={application.job?.employer?.company_name}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {application.job?.title}
                </h3>
                <Badge variant={statusColors[application.status] as any}>
                  {application.status}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {application.job?.employer?.company_name}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                {application.proposed_rate && (
                  <div>
                    Proposed rate: {formatCurrency(application.proposed_rate)}/hr
                  </div>
                )}
                <div>
                  Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                </div>
              </div>

              {application.cover_letter && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {application.cover_letter}
                  </p>
                </div>
              )}

              {application.status === ApplicationStatus.ACCEPTED && (
                <div className="mt-3 flex items-center text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">
                    Congratulations! Your application has been accepted.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <JobStatusBadge status={application.job?.status!} />
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView?.(application.id)}
              rightIcon={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
            >
              View Details
            </Button>
            
            {canWithdraw && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWithdraw?.(application.id)}
                leftIcon={<XMarkIcon className="w-4 h-4" />}
              >
                Withdraw
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};