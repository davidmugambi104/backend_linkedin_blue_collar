import React from 'react';
import { CheckCircleIcon, EyeIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import type { Job } from '@types';
import { JobStatus } from '@types';

interface JobStatusManagerProps {
  job: Job;
  onStatusChange?: (status: JobStatus) => void;
}

export const JobStatusManager: React.FC<JobStatusManagerProps> = ({ job, onStatusChange }) => {
  const isOpen = job.status === JobStatus.OPEN;
  const isInProgress = job.status === JobStatus.IN_PROGRESS;
  const isCompleted = job.status === JobStatus.COMPLETED;
  const isCancelled = job.status === JobStatus.CANCELLED;
  const isExpired = job.status === JobStatus.EXPIRED;

  return (
    <Card className="employer-bg-surface border employer-border rounded-2xl">
      <CardBody>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold employer-text-primary mb-4">
              Job Status
            </h3>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg employer-bg-muted">
            {isOpen && (
              <>
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold employer-text-primary">
                    Open
                  </p>
                  <p className="text-sm employer-text-muted">
                    This job is open and receiving applications
                  </p>
                </div>
              </>
            )}
            {isInProgress && (
              <>
                <EyeIcon className="h-6 w-6 employer-text-accent" />
                <div>
                  <p className="font-semibold employer-text-primary">
                    In Progress
                  </p>
                  <p className="text-sm employer-text-muted">
                    A worker has been hired and the job is in progress
                  </p>
                </div>
              </>
            )}
            {isCompleted && (
              <>
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold employer-text-primary">
                    Completed
                  </p>
                  <p className="text-sm employer-text-muted">
                    This job has been completed
                  </p>
                </div>
              </>
            )}
            {isCancelled && (
              <>
                <XCircleIcon className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold employer-text-primary">
                    Cancelled
                  </p>
                  <p className="text-sm employer-text-muted">
                    This job was cancelled
                  </p>
                </div>
              </>
            )}
            {isExpired && (
              <>
                <XCircleIcon className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold employer-text-primary">
                    Expired
                  </p>
                  <p className="text-sm employer-text-muted">
                    This job expired and is no longer accepting applications
                  </p>
                </div>
              </>
            )}
            {!isOpen && !isInProgress && !isCompleted && !isCancelled && !isExpired && (
              <>
                <EyeIcon className="h-6 w-6 employer-text-muted" />
                <div>
                  <p className="font-semibold employer-text-primary">
                    {job.status || 'Unknown'}
                  </p>
                  <p className="text-sm employer-text-muted">
                    Current job status
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t employer-border">
            {onStatusChange && isOpen && (
              <Button
                variant="outline"
                className="rounded-xl border employer-border employer-bg-surface employer-text-primary hover:employer-bg-muted"
                onClick={() => onStatusChange(JobStatus.CANCELLED)}
              >
                Cancel Job
              </Button>
            )}
            {onStatusChange && isInProgress && (
              <Button
                className="rounded-xl employer-button-primary shadow-sm active:scale-95"
                onClick={() => onStatusChange(JobStatus.COMPLETED)}
              >
                Mark Completed
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
