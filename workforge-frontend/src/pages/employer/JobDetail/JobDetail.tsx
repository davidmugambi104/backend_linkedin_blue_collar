import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShareIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UsersIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  PhoneIcon,
  EllipsisHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { class: string; label: string }> = {
    open: { class: 'badge-success', label: 'Open' },
    draft: { class: 'badge-neutral', label: 'Draft' },
    closed: { class: 'badge-error', label: 'Closed' },
    paused: { class: 'badge-warning', label: 'Paused' },
  };
  const { class: className, label } = config[status.toLowerCase()] || config.open;
  return <span className={className}>{label}</span>;
};

// Action Button
const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}> = ({ icon, label, onClick, variant = 'primary' }) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'text-red-600 hover:bg-red-50',
  };
  return (
    <button onClick={onClick} className={`${variants[variant]} text-sm`}>
      {icon}
      {label}
    </button>
  );
};

// Applicant Card
interface Applicant {
  id: number;
  name: string;
  role: string;
  applied: string;
  status: string;
  rating: number;
}

const ApplicantCard: React.FC<{ applicant: Applicant }> = ({ applicant }) => {
  const statusColors: Record<string, string> = {
    shortlisted: 'badge-success',
    pending: 'badge-warning',
    rejected: 'badge-error',
    reviewed: 'badge-info',
  };

  return (
    <Link 
      to={`/employer/applications`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-charcoal-50 transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy font-semibold text-sm">
        {applicant.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-charcoal truncate group-hover:text-navy transition-colors">
            {applicant.name}
          </p>
          <CheckBadgeIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        </div>
        <p className="text-xs text-muted">{applicant.role} • {applicant.applied}</p>
      </div>
      <span className={`badge ${statusColors[applicant.status]} text-xs`}>
        {applicant.status}
      </span>
    </Link>
  );
};

// Stats Overview
const StatsRow: React.FC<{ stats: { label: string; value: string; icon: React.ReactNode }[] }> = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {stats.map((stat) => (
      <div key={stat.label} className="text-center p-4 bg-charcoal-50 rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center text-navy mx-auto mb-2">
          {stat.icon}
        </div>
        <p className="text-xl font-bold text-charcoal">{stat.value}</p>
        <p className="text-xs text-muted mt-1">{stat.label}</p>
      </div>
    ))}
  </div>
);

// Main JobDetail Component
const JobDetail = () => {
  const { jobId } = useParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Mock job data
  const job = {
    id: jobId || '1',
    title: 'Commercial Electrician',
    company: 'WorkForge Builders',
    category: 'Electrical',
    type: 'Full-time',
    experience: 'Senior',
    status: 'open',
    description: `We are seeking an experienced Commercial Electrician to join our growing team. The ideal candidate will have extensive experience with commercial electrical systems, including:

• Installation, maintenance, and repair of electrical systems in commercial buildings
• Reading and interpreting blueprints, schematics, and diagrams
• Working with PLCs and automated systems
• Ensuring compliance with NEC codes and safety regulations
• Mentoring junior electricians

This is a great opportunity to join a established company with competitive benefits and growth opportunities.`,
    requirements: [
      '5+ years of commercial electrical experience',
      'Valid Journeyman or Master Electrician license',
      'OSHA 10-Hour Construction Safety certification',
      'Experience with PLC programming preferred',
      'Valid drivers license and reliable transportation',
    ],
    benefits: [
      'Health, dental, and vision insurance',
      '401(k) with company match',
      'Paid time off',
      'Professional development opportunities',
      'Company truck and tools provided',
    ],
    payMin: 35,
    payMax: 45,
    payPeriod: 'hourly',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    posted: '5 days ago',
    expires: '30 days',
    views: 432,
    uniqueViews: 389,
    applicants: 18,
    shortlisted: 5,
    hires: 0,
  };

  const applicants: Applicant[] = [
    { id: 1, name: 'James Wilson', role: 'Electrician', applied: '2 hours ago', status: 'shortlisted', rating: 5 },
    { id: 2, name: 'Sarah Chen', role: 'Electrician', applied: '5 hours ago', status: 'pending', rating: 4 },
    { id: 3, name: 'Michael Brown', role: 'Electrician', applied: '1 day ago', status: 'reviewed', rating: 4 },
    { id: 4, name: 'Emily Davis', role: 'Electrician', applied: '2 days ago', status: 'shortlisted', rating: 5 },
    { id: 5, name: 'Robert Miller', role: 'Electrician', applied: '3 days ago', status: 'pending', rating: 3 },
  ];

  const stats = [
    { label: 'Total Views', value: job.views.toString(), icon: <EyeIcon className="w-5 h-5" /> },
    { label: 'Unique Views', value: job.uniqueViews.toString(), icon: <UsersIcon className="w-5 h-5" /> },
    { label: 'Applicants', value: job.applicants.toString(), icon: <BriefcaseIcon className="w-5 h-5" /> },
    { label: 'Shortlisted', value: job.shortlisted.toString(), icon: <CheckBadgeIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <Link to="/employer/jobs" className="mt-1">
            <button className="icon-btn">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm text-muted">
              {job.company} • Job #{job.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button className="btn-secondary text-sm">
            <ShareIcon className="w-4 h-4" />
            Share
          </button>
          <button className="btn-secondary text-sm">
            <DocumentDuplicateIcon className="w-4 h-4" />
            Duplicate
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="btn-primary text-sm"
          >
            <PencilIcon className="w-4 h-4" />
            Edit Job
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatsRow stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description Card */}
          <div className="solid-card p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Job Description</h3>
            <div className="prose prose-sm max-w-none text-charcoal whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Requirements Card */}
          <div className="solid-card p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Requirements</h3>
            <ul className="space-y-3">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <CheckBadgeIcon className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-charcoal">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits Card */}
          <div className="solid-card p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {job.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-charcoal-50 rounded-lg">
                  <CheckBadgeIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-charcoal">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="solid-card p-5">
            <h4 className="font-semibold text-charcoal mb-4">Job Details</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy">
                  <CurrencyDollarIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Pay Range</p>
                  <p className="font-medium text-charcoal">${job.payMin}-${job.payMax}/hr</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Location</p>
                  <p className="font-medium text-charcoal">{job.city}, {job.state} {job.zip}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy">
                  <BriefcaseIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Type & Level</p>
                  <p className="font-medium text-charcoal">{job.type} • {job.experience}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Posted</p>
                  <p className="font-medium text-charcoal">{job.posted}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Applicants */}
          <div className="solid-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-charcoal">Recent Applicants</h4>
              <Link to="/employer/applications" className="text-sm text-navy font-medium hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-1">
              {applicants.slice(0, 5).map((applicant) => (
                <ApplicantCard key={applicant.id} applicant={applicant} />
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="solid-card p-5 border-red-200">
            <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              Danger Zone
            </h4>
            <div className="space-y-2">
              <button className="w-full btn-secondary text-sm justify-start text-red-600 hover:bg-red-50 border-red-200">
                <TrashIcon className="w-4 h-4" />
                Close Job
              </button>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full btn-ghost text-sm justify-start text-red-600 hover:bg-red-50"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="solid-card p-6 max-w-md mx-4 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-charcoal">Delete Job?</h3>
                <p className="text-sm text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-charcoal mb-6">
              Are you sure you want to delete <strong>&quot;{job.title}&quot;</strong>? 
              All applicant data will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button className="btn-primary bg-red-600 hover:bg-red-700">
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
