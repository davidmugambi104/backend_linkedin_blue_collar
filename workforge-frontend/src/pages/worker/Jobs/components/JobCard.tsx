import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPinIcon, 
  CurrencyDollarIcon, 
  BriefcaseIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Job, JobStatus } from '@types';
import { formatDistance } from '@lib/utils/geo';
import { formatCurrency, formatRelativeTime } from '@lib/utils/format';

interface JobCardProps {
  job: Job;
  onApply?: (jobId: number) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar
              name={job.employer?.company_name}
              size="lg"
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {job.title}
                </Link>
                <Badge variant={job.status === JobStatus.OPEN ? 'success' : 'default'} size="sm">
                  {job.status}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {job.employer?.company_name}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span>
                    {job.distance_km 
                      ? formatDistance(job.distance_km)
                      : job.address || 'Remote'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                  <span>
                    {formatCurrency(job.pay_min || 0)}
                    {job.pay_max && ` - ${formatCurrency(job.pay_max)}`}
                    {job.pay_type && `/${job.pay_type}`}
                  </span>
                </div>
                
                {job.required_skill && (
                  <div className="flex items-center">
                    <BriefcaseIcon className="w-4 h-4 mr-1" />
                    <span>{job.required_skill.name}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>{formatRelativeTime(job.created_at)}</span>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {job.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {job.application_count} applications
          </div>
          {onApply && job.status === JobStatus.OPEN && (
            <Button
              size="sm"
              onClick={() => onApply(job.id)}
            >
              Apply Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};