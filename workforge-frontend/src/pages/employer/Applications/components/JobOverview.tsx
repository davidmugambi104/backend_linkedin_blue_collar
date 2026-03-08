import React from 'react';
import { MapPinIcon, BriefcaseIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@components/ui/Card';
import type { Job } from '@types';

interface JobOverviewProps {
  job: Job;
}

export const JobOverview: React.FC<JobOverviewProps> = ({ job }) => {
  return (
    <Card className="employer-bg-surface border employer-border rounded-2xl">
      <CardBody>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold employer-text-primary mb-4">
              Job Overview
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium employer-text-muted">
                Location
              </p>
              <div className="flex items-center gap-2 mt-1">
                <MapPinIcon className="h-5 w-5 employer-text-muted" />
                <span className="employer-text-primary">
                  {job.location || 'Remote'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium employer-text-muted">
                Employment Type
              </p>
              <div className="flex items-center gap-2 mt-1">
                <BriefcaseIcon className="h-5 w-5 employer-text-muted" />
                <span className="employer-text-primary">
                  {job.employment_type || 'Not specified'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium employer-text-muted">
                Salary Range
              </p>
              <div className="flex items-center gap-2 mt-1">
                <CurrencyDollarIcon className="h-5 w-5 employer-text-muted" />
                <span className="employer-text-primary">
                  ${job.salary_min?.toLocaleString() || '0'} - ${job.salary_max?.toLocaleString() || 'Negotiable'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium employer-text-muted">
                Total Applicants
              </p>
              <div className="flex items-center gap-2 mt-1">
                <UserGroupIcon className="h-5 w-5 employer-text-muted" />
                <span className="employer-text-primary">
                  {job.applicants?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {job.description && (
            <div className="border-t employer-border pt-6">
              <p className="text-sm font-medium employer-text-muted mb-2">
                Description
              </p>
              <div className="prose prose-slate max-w-none employer-text-primary whitespace-pre-wrap">
                {job.description}
              </div>
            </div>
          )}

          {job.requirements && (
            <div className="border-t employer-border pt-4">
              <p className="text-sm font-medium employer-text-muted mb-2">
                Requirements
              </p>
              <div className="prose prose-slate max-w-none employer-text-primary whitespace-pre-wrap">
                {job.requirements}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
