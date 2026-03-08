import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useEmployerJobs, useDeleteJob } from '@hooks/useEmployerJobs';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';

const Jobs: React.FC = () => {
  const { data: jobs = [], isLoading, isError, error } = useEmployerJobs();
  const deleteJobMutation = useDeleteJob();

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this job?')) {
      deleteJobMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'expired':
        return 'warning';
      case 'completed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">My Job Postings</h1>
          <p className="mt-2 text-[#64748B]">Manage and monitor your job listings</p>
        </div>
        <Link to="/employer/jobs/post">
          <Button className="flex items-center space-x-2 rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95">
            <PlusIcon className="h-4 w-4" />
            <span>Post New Job</span>
          </Button>
        </Link>
      </div>

      {isLoading && (
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
          <p className="text-[#64748B]">Loading jobs...</p>
        </Card>
      )}

      {isError && (
        <Card className="bg-white border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-700">
            Error loading jobs: {error?.message}
          </p>
        </Card>
      )}

      {!isLoading && jobs.length === 0 && (
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
          <p className="text-[#64748B] mb-4">No job postings yet</p>
          <Link to="/employer/jobs/post">
            <Button size="sm" className="rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95">
              Create your first job posting
            </Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-6">
        {jobs.map(job => (
          <Card key={job.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-[#0F172A]">{job.title}</h2>
                  <Badge variant={getStatusColor(job.status)} className="capitalize">
                    {job.status}
                  </Badge>
                </div>
                <p className="mt-2 text-[#64748B] line-clamp-2">{job.description}</p>
                <div className="mt-4 flex items-center space-x-6 text-sm text-[#64748B] flex-wrap">
                  {job.application_count !== undefined && (
                    <span><strong>{job.application_count}</strong> applications</span>
                  )}
                  {job.pay_min && job.pay_max && (
                    <span>Pay: ${job.pay_min} - ${job.pay_max}</span>
                  )}
                  <span>Posted {formatDate(job.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Link to={`/employer/jobs/${job.id}`}>
                  <Button variant="ghost" size="sm" title="View job" className="text-[#2563EB]">
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to={`/employer/jobs/${job.id}`}>
                  <Button variant="ghost" size="sm" title="Edit job" className="text-[#2563EB]">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Delete job"
                  onClick={() => handleDelete(job.id)}
                  disabled={deleteJobMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Jobs;
