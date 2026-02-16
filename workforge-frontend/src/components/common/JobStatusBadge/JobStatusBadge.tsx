import React from 'react';
import { Badge } from '@components/ui/Badge';
import { JobStatus } from '@types';

interface JobStatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<JobStatus, { variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'; label: string }> = {
  [JobStatus.OPEN]: { variant: 'success', label: 'Open' },
  [JobStatus.IN_PROGRESS]: { variant: 'info', label: 'In Progress' },
  [JobStatus.COMPLETED]: { variant: 'purple', label: 'Completed' },
  [JobStatus.CANCELLED]: { variant: 'error', label: 'Cancelled' },
  [JobStatus.EXPIRED]: { variant: 'warning', label: 'Expired' },
};

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};