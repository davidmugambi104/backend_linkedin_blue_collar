import React from 'react';
import { ChartBarIcon, UsersIcon, EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@components/ui/Card';
import type { Job } from '@types';
import { ApplicationStatus } from '@types';

interface JobAnalyticsProps {
  job: Job;
}

export const JobAnalytics: React.FC<JobAnalyticsProps> = ({ job }) => {
  const totalApplicants = job.applicants?.length || 0;
  const acceptedCount = job.applicants?.filter(a => a.status === ApplicationStatus.ACCEPTED).length || 0;
  const pendingCount = job.applicants?.filter(a => a.status === ApplicationStatus.PENDING).length || 0;
  const withdrawnCount = job.applicants?.filter(a => a.status === ApplicationStatus.WITHDRAWN).length || 0;
  const acceptanceRate = totalApplicants > 0 ? ((acceptedCount / totalApplicants) * 100).toFixed(1) : 0;

  const stats = [
    {
      label: 'Total Applications',
      value: totalApplicants,
      icon: UsersIcon,
    },
    {
      label: 'Withdrawn',
      value: withdrawnCount,
      icon: EyeIcon,
    },
    {
      label: 'Accepted',
      value: acceptedCount,
      icon: CheckCircleIcon,
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: UsersIcon,
    },
  ];

  return (
    <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
      <CardBody>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-[#2563EB]" />
              Application Analytics
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-[#F8FAFC] p-6 rounded-2xl flex items-center gap-4"
                >
                  <div className="p-3 bg-[#2563EB]/10 rounded-xl text-[#2563EB]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#0F172A]">
                      {stat.value}
                    </p>
                    <p className="text-sm text-[#64748B]">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border border-[#E2E8F0] rounded-2xl p-6 text-center bg-white">
            <p className="text-sm font-medium text-[#64748B] mb-1">
              Acceptance Rate
            </p>
            <p className="text-3xl font-bold text-[#0F172A]">
              {acceptanceRate}%
            </p>
            <p className="text-xs text-[#64748B] mt-2">
              {acceptedCount} accepted out of {totalApplicants} total applications
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
