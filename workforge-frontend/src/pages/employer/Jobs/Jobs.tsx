import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowsUpDownIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { useEmployerJobs, useDeleteJob } from '@hooks/useEmployerJobs';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';

type SortKey = 'title' | 'status' | 'created_at' | 'application_count';

type SortState = {
  key: SortKey;
  order: 'asc' | 'desc';
};

const Jobs: React.FC = () => {
  const { data: jobs = [], isLoading, isError, error } = useEmployerJobs();
  const deleteJobMutation = useDeleteJob();
  const [sort, setSort] = useState<SortState>({ key: 'created_at', order: 'desc' });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this job?')) {
      deleteJobMutation.mutate(id);
    }
  };

  const handleSort = (key: SortKey) => {
    setSort((current) => {
      if (current.key === key) {
        return { key, order: current.order === 'asc' ? 'desc' : 'asc' };
      }
      return { key, order: 'asc' };
    });
  };

  const sortedJobs = useMemo(() => {
    const next = [...jobs];
    next.sort((a, b) => {
      const direction = sort.order === 'asc' ? 1 : -1;
      if (sort.key === 'application_count') {
        return (((a.application_count as number) || 0) - ((b.application_count as number) || 0)) * direction;
      }
      if (sort.key === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
      }
      const left = String(a[sort.key] ?? '').toLowerCase();
      const right = String(b[sort.key] ?? '').toLowerCase();
      return left.localeCompare(right) * direction;
    });
    return next;
  }, [jobs, sort]);

  const statusClass = (status: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'open' || normalized === 'published') {
      return 'employer-status-published';
    }
    return 'employer-status-draft';
  };

  const toSentenceCase = (value: string) =>
    value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^\w)|\s\w/g, (text) => text.toUpperCase());

  return (
    <div className="space-y-6 employer-page-m3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0A2540]">My Job Postings</h1>
          <p className="mt-2 text-[#3C4A5B]">Manage and monitor your job listings</p>
        </div>
        <Link to="/employer/jobs/post">
          <Button className="flex items-center space-x-2 rounded-xl bg-[#0A2540] text-white hover:bg-[#081D32]">
            <PlusIcon className="h-4 w-4" />
            <span>Post New Job</span>
          </Button>
        </Link>
      </div>

      {isLoading && (
        <Card className="employer-m3-card rounded-2xl p-8 text-center">
          <p className="text-[#3C4A5B]">Loading jobs...</p>
        </Card>
      )}

      {isError && (
        <Card className="employer-m3-card rounded-2xl border-red-200 p-8 text-center">
          <p className="text-red-700">Error loading jobs: {error?.message}</p>
        </Card>
      )}

      {!isLoading && jobs.length === 0 && (
        <Card className="employer-empty-state rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E9EDF2] bg-white">
            <BriefcaseIcon className="h-8 w-8 text-[#0A2540]" />
          </div>
          <h2 className="text-lg font-semibold text-[#0A2540]">No jobs yet</h2>
          <p className="mt-2 text-sm text-[#3C4A5B]">Post your first job to see applicants</p>
          <Link to="/employer/jobs/post">
            <Button size="sm" className="mt-5 rounded-xl bg-[#0A2540] text-white hover:bg-[#081D32]">
              Create your first job posting
            </Button>
          </Link>
        </Card>
      )}

      {!isLoading && jobs.length > 0 && (
        <Card className="employer-m3-table-wrapper rounded-2xl p-0">
          <div className="max-h-[560px] overflow-auto rounded-2xl">
            <table className="employer-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => handleSort('title')} className="inline-flex items-center gap-1 text-[#0A2540]">
                      Job
                      <ArrowsUpDownIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('status')} className="inline-flex items-center gap-1 text-[#0A2540]">
                      Status
                      <ArrowsUpDownIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('application_count')} className="inline-flex items-center gap-1 text-[#0A2540]">
                      Applicants
                      <ArrowsUpDownIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('created_at')} className="inline-flex items-center gap-1 text-[#0A2540]">
                      Posted
                      <ArrowsUpDownIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="font-semibold text-[#1A1A1A]">{job.title}</div>
                      <div className="line-clamp-1 text-sm text-[#3C4A5B]">{job.description}</div>
                    </td>
                    <td>
                      <Badge variant="default" className={`capitalize ${statusClass(job.status)}`}>
                        {toSentenceCase(job.status || 'draft')}
                      </Badge>
                    </td>
                    <td className="text-[#1A1A1A]">{job.application_count || 0}</td>
                    <td className="text-[#3C4A5B]">{new Date(job.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/employer/jobs/${job.id}`}>
                          <Button variant="ghost" size="sm" title="View job" className="text-[#0A2540]">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/employer/jobs/${job.id}`}>
                          <Button variant="ghost" size="sm" title="Edit job" className="text-[#0A2540]">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Jobs;
