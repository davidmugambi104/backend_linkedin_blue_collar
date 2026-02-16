import React from 'react';
import { EmployerStats } from './components/EmployerStats';
import { RecentJobPostings } from './components/RecentJobPostings';
import { TopApplicants } from './components/TopApplicants';
import { HiringProgress } from './components/HiringProgress';
import { PendingReviews } from './components/PendingReviews';

export const EmployerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Employer Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Manage your job postings, review applications, and hire workers.
        </p>
      </div>

      <EmployerStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentJobPostings />
          <HiringProgress />
        </div>
        <div className="space-y-6">
          <TopApplicants />
          <PendingReviews />
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;