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
    <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
      <CardBody>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4">
              Job Status
            </h3>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-[#F8FAFC]">
            {isOpen && (
              <>
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-[#0F172A]">
                    Open
                  </p>
                  <p className="text-sm text-[#64748B]">
                    This job is open and receiving applications
                  </p>
                </div>
              </>
            )}
            {isInProgress && (
              <>
                <EyeIcon className="h-6 w-6 text-[#2563EB]" />
                <div>
                  <p className="font-semibold text-[#0F172A]">
                    In Progress
                  </p>
                  <p className="text-sm text-[#64748B]">
                    A worker has been hired and the job is in progress
                  </p>
                </div>
              </>
            )}
            {isCompleted && (
              <>
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-[#0F172A]">
                    Completed
                  </p>
                  <p className="text-sm text-[#64748B]">
                    This job has been completed
                  </p>
                </div>
              </>
            )}
            {isCancelled && (
              <>
                <XCircleIcon className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-[#0F172A]">
                    Cancelled
                  </p>
                  <p className="text-sm text-[#64748B]">
                    This job was cancelled
                  </p>
                </div>
              </>
            )}
            {isExpired && (
              <>
                <XCircleIcon className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-[#0F172A]">
                    Expired
                  </p>
                  <p className="text-sm text-[#64748B]">
                    This job expired and is no longer accepting applications
                  </p>
                </div>
              </>
            )}
            {!isOpen && !isInProgress && !isCompleted && !isCancelled && !isExpired && (
              <>
                <EyeIcon className="h-6 w-6 text-[#64748B]" />
                <div>
                  <p className="font-semibold text-[#0F172A]">
                    {job.status || 'Unknown'}
                  </p>
                  <p className="text-sm text-[#64748B]">
                    Current job status
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-[#E2E8F0]">
            {onStatusChange && isOpen && (
              <Button
                variant="outline"
                className="rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                onClick={() => onStatusChange(JobStatus.CANCELLED)}
              >
                Cancel Job
              </Button>
            )}
            {onStatusChange && isInProgress && (
              <Button
                className="rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95"
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
