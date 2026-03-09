import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon, 
  Squares2X2Icon, 
  TableCellsIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UsersIcon,
  EyeIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useEmployerJobs, useDeleteJob } from '@hooks/useEmployerJobs';

// Search Input Component
const SearchInput: React.FC<{ 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative">
    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field pl-12"
    />
  </div>
);

// Filter Chip Component
interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-navy text-white shadow-md' 
        : 'bg-white text-muted border border-charcoal-200 hover:border-navy hover:text-navy'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-charcoal-100'}`}>
        {count}
      </span>
    )}
  </button>
);

// View Toggle Button
const ViewToggle: React.FC<{ 
  view: 'grid' | 'table'; 
  onChange: (view: 'grid' | 'table') => void;
}> = ({ view, onChange }) => (
  <div className="flex items-center gap-1 bg-white border border-charcoal-200 rounded-lg p-1">
    <button
      onClick={() => onChange('table')}
      className={`p-2 rounded-md transition-all ${
        view === 'table' ? 'bg-navy text-white' : 'text-muted hover:text-navy'
      }`}
      aria-label="Table view"
    >
      <TableCellsIcon className="w-5 h-5" />
    </button>
    <button
      onClick={() => onChange('grid')}
      className={`p-2 rounded-md transition-all ${
        view === 'grid' ? 'bg-navy text-white' : 'text-muted hover:text-navy'
      }`}
      aria-label="Grid view"
    >
      <Squares2X2Icon className="w-5 h-5" />
    </button>
  </div>
);

// Job Card Component (Grid View)
interface JobCardProps {
  job: JobItem;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const statusClasses: Record<string, string> = {
    open: 'badge-success',
    draft: 'badge-neutral',
    closed: 'badge-error',
  };

  return (
    <div className="solid-card p-5 group hover:border-navy/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-lg">
            {job.title.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-charcoal group-hover:text-navy transition-colors">{job.title}</h4>
            <p className="text-sm text-muted">{job.location}</p>
          </div>
        </div>
        <Link to={`/employer/jobs/${job.id}`} className="icon-btn opacity-0 group-hover:opacity-100 transition-opacity">
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className={`badge ${statusClasses[job.status.toLowerCase()]}`}>
          {job.status}
        </span>
        <span className="text-sm text-muted flex items-center gap-1">
          <CurrencyDollarIcon className="w-4 h-4" />
          {job.salaryRange}
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-charcoal-100">
        <div className="flex items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-1">
            <UsersIcon className="w-4 h-4" />
            {job.applicants} applicants
          </span>
          <span className="flex items-center gap-1">
            <EyeIcon className="w-4 h-4" />
            {job.views} views
          </span>
        </div>
        <Link 
          to={`/employer/jobs/${job.id}`}
          className="text-sm font-medium text-navy hover:underline flex items-center gap-1"
        >
          View <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

// Job Table Row Component
const JobTableRow: React.FC<{ job: JobItem }> = ({ job }) => {
  const statusClasses: Record<string, string> = {
    open: 'badge-success',
    draft: 'badge-neutral',
    closed: 'badge-error',
  };

  return (
    <tr className="interactive-row group">
      <td className="font-medium text-charcoal">{job.title}</td>
      <td>
        <span className={`badge ${statusClasses[job.status.toLowerCase()]}`}>
          {job.status}
        </span>
      </td>
      <td className="text-charcoal">{job.applicants}</td>
      <td className="text-charcoal">{job.views}</td>
      <td className="text-charcoal">{job.salaryRange}</td>
      <td className="text-muted">{job.location}</td>
      <td>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`/employer/jobs/${job.id}`}>
            <button className="icon-btn" type="button">
              <EyeIcon className="w-4 h-4" />
            </button>
          </Link>
            <Link to={`/employer/jobs/${job.id}`}>
              <button className="icon-btn" type="button">
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </button>
            </Link>
        </div>
      </td>
    </tr>
  );
};

// Empty State Component
const EmptyState: React.FC = () => (
  <div className="empty-state">
    <div className="w-16 h-16 rounded-full bg-charcoal-100 flex items-center justify-center mx-auto mb-4">
      <BriefcaseIcon className="w-8 h-8 text-muted" />
    </div>
    <h3 className="text-lg font-semibold text-charcoal mb-2">No jobs found</h3>
    <p className="text-muted mb-6">Adjust your search or create your first job posting.</p>
    <Link to="/employer/post-job">
      <button className="btn-primary">
        <PlusIcon className="w-5 h-5" />
        Create Job
      </button>
    </Link>
  </div>
);

// Types
interface JobItem {
  id: number;
  title: string;
  status: string;
  applicants: number;
  views: number;
  salaryRange: string;
  location: string;
}

const Jobs = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [page, setPage] = useState(1);
  const { data: jobs = [], isLoading } = useEmployerJobs();
  const deleteJobMutation = useDeleteJob();

  const jobItems = useMemo<JobItem[]>(() => jobs.map((job) => {
    const payMin = job.pay_min ?? job.salary_min;
    const payMax = job.pay_max ?? job.salary_max;
    const payType = String(job.pay_type || 'hourly').toLowerCase();

    return {
      id: job.id,
      title: job.title,
      status: String(job.status || 'open'),
      applicants: job.application_count || 0,
      views: Number((job as any).views || (job as any).view_count || 0),
      salaryRange: payMin || payMax ? `$${payMin ?? 0}-$${payMax ?? payMin ?? 0}/${payType}` : 'N/A',
      location: job.address || 'Location not specified',
    };
  }), [jobs]);

  // Filter jobs
  const filtered = useMemo(() => {
    return jobItems.filter((job) => {
      const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === 'all' || job.status.toLowerCase() === filter;
      return matchesQuery && matchesFilter;
    });
  }, [jobItems, query, filter]);

  // Stats for filter chips
  const jobCounts = useMemo(() => ({
    all: jobItems.length,
    open: jobItems.filter(j => j.status.toLowerCase() === 'open').length,
    draft: jobItems.filter(j => j.status.toLowerCase() === 'draft').length,
  }), [jobItems]);

  const handleDelete = async (jobId: number) => {
    await deleteJobMutation.mutateAsync(jobId);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-subtitle">Manage your job listings and monitor demand</p>
        </div>
        <Link to="/employer/post-job">
          <button className="btn-primary">
            <PlusIcon className="w-5 h-5" />
            Post New Job
          </button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="solid-card p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <SearchInput 
              value={query} 
              onChange={setQuery}
              placeholder="Search jobs by title..."
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FilterChip 
                label="All" 
                active={filter === 'all'} 
                onClick={() => setFilter('all')}
                count={jobCounts.all}
              />
              <FilterChip 
                label="Open" 
                active={filter === 'open'} 
                onClick={() => setFilter('open')}
                count={jobCounts.open}
              />
              <FilterChip 
                label="Draft" 
                active={filter === 'draft'} 
                onClick={() => setFilter('draft')}
                count={jobCounts.draft}
              />
            </div>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
      </div>

      {/* Jobs Display */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="solid-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="employer-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Views</th>
                  <th>Salary</th>
                  <th>Location</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id} className="interactive-row group">
                    <td className="font-medium text-charcoal">{job.title}</td>
                    <td>
                      <span className={`badge ${job.status.toLowerCase() === 'open' ? 'badge-success' : job.status.toLowerCase() === 'draft' ? 'badge-neutral' : 'badge-error'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="text-charcoal">{job.applicants}</td>
                    <td className="text-charcoal">{job.views}</td>
                    <td className="text-charcoal">{job.salaryRange}</td>
                    <td className="text-muted">{job.location}</td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/employer/jobs/${job.id}`}>
                          <button className="icon-btn">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </Link>
                        <button className="icon-btn" onClick={() => handleDelete(job.id)}>
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isLoading && <p className="p-4 text-sm text-muted">Loading jobs...</p>}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted">
            Showing {filtered.length} of {jobItems.length} jobs
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium text-charcoal">
              Page {page} of 3
            </span>
            <button 
              onClick={() => setPage(p => Math.min(3, p + 1))}
              disabled={page === 3}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
