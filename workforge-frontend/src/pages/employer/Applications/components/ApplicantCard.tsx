import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import type { Application } from '@types';
import { ApplicationStatus } from '@types';
import { formatDate } from '@lib/utils/format';

interface ApplicantCardProps {
  application: Application;
  onStatusChange?: (status: Application['status']) => void;
}

export const ApplicantCard: React.FC<ApplicantCardProps> = ({ application, onStatusChange }) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-50 text-green-600';
      case 'rejected':
        return 'bg-red-50 text-red-600';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600';
      case 'withdrawn':
        return 'bg-slate-50 text-slate-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Card className="employer-bg-surface border employer-border rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full employer-button-primary flex items-center justify-center font-semibold">
              {application.worker?.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-semibold employer-text-primary">
                {application.worker?.full_name || 'Unknown Applicant'}
              </h3>
              {application.worker?.title && (
                <p className="text-sm employer-text-muted">
                  {application.worker.title}
                </p>
              )}
            </div>
          </div>

          {application.cover_letter && (
            <p className="mt-3 text-sm employer-text-muted">
              {application.cover_letter}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs employer-text-muted">
            <span>Applied {formatDate(application.created_at)}</span>
            {application.worker?.average_rating && (
              <span className="flex items-center gap-1">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                {application.worker.average_rating}
              </span>
            )}
          </div>
        </div>

        <div className="ml-4">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
              application.status
            )}`}
          >
            {getStatusIcon(application.status)}
            {application.status}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 justify-end">
        <Link to={`/employer/applications/${application.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border employer-border employer-bg-surface employer-text-primary hover:employer-bg-muted"
          >
            View Details
          </Button>
        </Link>
        {application.status === ApplicationStatus.PENDING && onStatusChange && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border employer-border employer-bg-surface employer-text-primary hover:employer-bg-muted"
              onClick={() => onStatusChange(ApplicationStatus.REJECTED)}
            >
              Reject
            </Button>
            <Button
              size="sm"
              className="rounded-xl employer-button-primary shadow-sm active:scale-95"
              onClick={() => onStatusChange(ApplicationStatus.ACCEPTED)}
            >
              Accept
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
