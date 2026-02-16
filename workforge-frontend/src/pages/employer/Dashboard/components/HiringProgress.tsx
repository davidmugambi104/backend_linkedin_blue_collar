import React from 'react';
import { Card, CardBody } from '@components/ui/Card';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useEmployerApplications } from '@hooks/useEmployer';

export const HiringProgress: React.FC = () => {
  const { data: applications = [] } = useEmployerApplications();

  const statusCounts = {
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    withdrawn: applications.filter(a => a.status === 'withdrawn').length,
  };

  const total = applications.length || 1;
  const acceptedRate = ((statusCounts.accepted / total) * 100).toFixed(0);

  return (
    <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
      <CardBody className="p-5">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="h-5 w-5 text-[#2563EB]" />
            <h3 className="text-lg font-semibold text-[#0F172A]">
              Hiring Progress
            </h3>
          </div>

          <div className="space-y-4">
            {/* Pending */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#64748B]">
                  Pending Review
                </span>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {statusCounts.pending}
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(statusCounts.pending / total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Withdrawn */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#64748B]">
                  Withdrawn
                </span>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {statusCounts.withdrawn}
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(statusCounts.withdrawn / total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Accepted */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#64748B]">
                  Accepted
                </span>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {statusCounts.accepted}
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(statusCounts.accepted / total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Rejected */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#64748B]">
                  Rejected
                </span>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {statusCounts.rejected}
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(statusCounts.rejected / total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Acceptance Rate */}
            <div className="border-t border-[#E2E8F0] pt-4 mt-4">
              <p className="text-sm font-medium text-[#64748B] mb-2">
                Overall Acceptance Rate
              </p>
              <p className="text-3xl font-bold text-green-600">
                {acceptedRate}%
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
