import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  EllipsisHorizontalIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

// Search Input
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

// Filter Chip
interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick, count, variant = 'default' }) => {
  const variantClasses = {
    default: active ? 'bg-navy text-white' : 'bg-white text-muted border-charcoal-200 hover:border-navy hover:text-navy',
    success: active ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-500',
    warning: active ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-500',
    error: active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border-red-200 hover:border-red-500',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${variantClasses[variant]}`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : ''}`}>
          {count}
        </span>
      )}
    </button>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { class: string; icon: React.ReactNode; label: string }> = {
    shortlisted: { class: 'badge-success', icon: <CheckCircleIcon className="w-3.5 h-3.5" />, label: 'Shortlisted' },
    pending: { class: 'badge-warning', icon: <ClockIcon className="w-3.5 h-3.5" />, label: 'Pending' },
    rejected: { class: 'badge-error', icon: <XCircleIcon className="w-3.5 h-3.5" />, label: 'Rejected' },
    hired: { class: 'badge-success', icon: <CheckCircleIcon className="w-3.5 h-3.5" />, label: 'Hired' },
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

  return (
    <span className={`badge ${config.class} flex items-center gap-1.5`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// Applicant Row for Table
interface Applicant {
  id: number;
  name: string;
  email: string;
  phone: string;
  job: string;
  status: string;
  applied: string;
  rating: number;
  avatar?: string;
}

const ApplicantTableRow: React.FC<{ applicant: Applicant }> = ({ applicant }) => (
  <tr className="interactive-row group">
    <td>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy font-semibold">
          {applicant.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="font-medium text-charcoal">{applicant.name}</p>
          <p className="text-xs text-muted">{applicant.email}</p>
        </div>
      </div>
    </td>
    <td className="text-charcoal">{applicant.job}</td>
    <td><StatusBadge status={applicant.status} /></td>
    <td className="text-muted">{applicant.applied}</td>
    <td>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon 
            key={star} 
            className={`w-4 h-4 ${star <= applicant.rating ? 'text-amber-400 fill-amber-400' : 'text-charcoal-200'}`} 
          />
        ))}
      </div>
    </td>
    <td>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="icon-btn" title="Send Email">
          <EnvelopeIcon className="w-4 h-4" />
        </button>
        <button className="icon-btn" title="View Profile">
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </button>
        <button className="icon-btn">
          <EllipsisHorizontalIcon className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
);

// Stats Overview Cards
const OverviewCards: React.FC = () => {
  const stats = [
    { label: 'Total Applications', value: '47', icon: <UsersIcon className="w-6 h-6" />, color: 'navy' },
    { label: 'Shortlisted', value: '12', icon: <CheckCircleIcon className="w-6 h-6" />, color: 'emerald' },
    { label: 'Pending Review', value: '8', icon: <ClockIcon className="w-6 h-6" />, color: 'amber' },
    { label: 'Rejected', value: '27', icon: <XCircleIcon className="w-6 h-6" />, color: 'red' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={stat.label} className={`stat-widget stagger-${i + 1}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stat.color === 'navy' ? 'bg-navy-100 text-navy' :
              stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
              stat.color === 'amber' ? 'bg-amber-100 text-amber-600' :
              'bg-red-100 text-red-600'
            }`}>
              {stat.icon}
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
          <p className="text-sm text-muted mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

// Mock Data
const mockApplicants: Applicant[] = [
  { id: 1, name: 'Ariana Flores', email: 'ariana@example.com', phone: '+1 555-0123', job: 'Electrician', status: 'Shortlisted', applied: '2 hours ago', rating: 4 },
  { id: 2, name: 'Samuel Reed', email: 'samuel.r@example.com', phone: '+1 555-0124', job: 'HVAC Technician', status: 'Pending', applied: '5 hours ago', rating: 3 },
  { id: 3, name: 'Nina Patel', email: 'nina.p@example.com', phone: '+1 555-0125', job: 'Project Coordinator', status: 'Rejected', applied: '1 day ago', rating: 2 },
  { id: 4, name: 'James Wilson', email: 'james.w@example.com', phone: '+1 555-0126', job: 'Electrician', status: 'Shortlisted', applied: '1 day ago', rating: 5 },
  { id: 5, name: 'Maria Garcia', email: 'maria.g@example.com', phone: '+1 555-0127', job: 'Carpenter', status: 'Pending', applied: '2 days ago', rating: 4 },
  { id: 6, name: 'David Chen', email: 'david.c@example.com', phone: '+1 555-0128', job: 'Plumber', status: 'Hired', applied: '3 days ago', rating: 5 },
];

const Applications = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Filter applicants
  const filtered = useMemo(() => {
    return mockApplicants.filter((app) => {
      const matchesQuery = 
        app.name.toLowerCase().includes(query.toLowerCase()) || 
        app.job.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' || app.status.toLowerCase() === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  // Stats counts
  const counts = useMemo(() => ({
    all: mockApplicants.length,
    shortlisted: mockApplicants.filter(a => a.status.toLowerCase() === 'shortlisted').length,
    pending: mockApplicants.filter(a => a.status.toLowerCase() === 'pending').length,
    rejected: mockApplicants.filter(a => a.status.toLowerCase() === 'rejected').length,
  }), []);

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">Review and manage job applicants</p>
        </div>
        <Link to="/employer/jobs">
          <button className="btn-secondary">
            <BriefcaseIcon className="w-5 h-5" />
            View Jobs
          </button>
        </Link>
      </div>

      {/* Overview Stats */}
      <OverviewCards />

      {/* Search & Filter */}
      <div className="solid-card p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <SearchInput 
              value={query} 
              onChange={setQuery}
              placeholder="Search applicants by name or job..."
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip 
              label="All" 
              active={status === 'all'} 
              onClick={() => setStatus('all')}
              count={counts.all}
            />
            <FilterChip 
              label="Shortlisted" 
              active={status === 'shortlisted'} 
              onClick={() => setStatus('shortlisted')}
              count={counts.shortlisted}
              variant="success"
            />
            <FilterChip 
              label="Pending" 
              active={status === 'pending'} 
              onClick={() => setStatus('pending')}
              count={counts.pending}
              variant="warning"
            />
            <FilterChip 
              label="Rejected" 
              active={status === 'rejected'} 
              onClick={() => setStatus('rejected')}
              count={counts.rejected}
              variant="error"
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="w-16 h-16 rounded-full bg-charcoal-100 flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">No applications found</h3>
          <p className="text-muted">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="solid-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="employer-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Rating</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((applicant) => (
                  <ApplicantTableRow key={applicant.id} applicant={applicant} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted">
            Showing {filtered.length} of {mockApplicants.length} applications
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
              Page {page} of 2
            </span>
            <button 
              onClick={() => setPage(p => Math.min(2, p + 1))}
              disabled={page === 2}
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

export default Applications;
