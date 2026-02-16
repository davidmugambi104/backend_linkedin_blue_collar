import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@components/ui/Button';
import { JobStatusBadge } from '@components/common/JobStatusBadge';
import { ApplicantsList } from './components/ApplicantsList';
import { JobOverview } from './components/JobOverview';
import { JobStatusManager } from './components/JobStatusManager';
import { JobAnalytics } from './components/JobAnalytics';
import { useEmployerJob, useDeleteJob } from '@hooks/useEmployerJobs';
import { Skeleton } from '@components/ui/Skeleton';
import { toast } from 'react-toastify';

export const EmployerJobDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  const { data: job, isLoading } = useEmployerJob(Number(jobId));
  const deleteJob = useDeleteJob();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      try {
        await deleteJob.mutateAsync(Number(jobId));
        toast.success('Job deleted successfully');
        navigate('/employer/jobs');
      } catch (error) {
        toast.error('Failed to delete job');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-[#64748B]">Job not found</p>
        <Button
          onClick={() => navigate('/employer/jobs')}
          className="mt-4 rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95"
        >
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/employer/jobs')}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
            className="text-[#2563EB] hover:underline"
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              {job.title}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <JobStatusBadge status={job.status} />
              <span className="text-sm text-[#64748B]">
                Posted on {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/employer/jobs/${jobId}/edit`)}
            leftIcon={<PencilIcon className="w-4 h-4" />}
            className="rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            leftIcon={<TrashIcon className="w-4 h-4" />}
            className="rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <JobOverview job={job} />
          <ApplicantsList />
        </div>

        {/* Right Column - Management & Analytics */}
        <div className="space-y-6">
          <JobStatusManager job={job} />
          <JobAnalytics job={job} />
        </div>
      </div>
    </div>
  );
};

export default EmployerJobDetail;