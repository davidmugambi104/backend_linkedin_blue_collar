import { Link } from 'react-router-dom';
import { 
  BriefcaseIcon, 
  UserGroupIcon, 
  EyeIcon, 
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  variant?: 'default' | 'gradient';
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  trend, 
  variant = 'default' 
}) => {
  if (variant === 'gradient') {
    return (
      <div className="stat-widget-gradient">
        <div className="flex items-start justify-between relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white">
            {icon}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm font-medium text-emerald-300">
              <ArrowTrendingUpIcon className="w-4 h-4" />
              <span>+{trend}%</span>
            </div>
          )}
        </div>
        <div className="mt-5 relative z-10">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-white/70 mt-1">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-widget">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-lg bg-navy-50 flex items-center justify-center text-navy">
          {icon}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
            <ArrowTrendingUpIcon className="w-4 h-4" />
            <span>+{trend}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-charcoal">{value}</p>
        <p className="text-sm text-muted mt-1">{label}</p>
      </div>
    </div>
  );
};

// Job Row Component
interface JobRow {
  id: number;
  title: string;
  status: 'open' | 'draft' | 'closed';
  applicants: number;
  views: number;
  posted: string;
}

const JobRow: React.FC<{ job: JobRow }> = ({ job }) => {
  const statusClasses = {
    open: 'badge-success',
    draft: 'badge-neutral',
    closed: 'badge-error',
  };

  return (
    <tr className="interactive-row">
      <td className="font-medium text-charcoal">{job.title}</td>
      <td>
        <span className={`badge ${statusClasses[job.status]}`}>
          {job.status}
        </span>
      </td>
      <td className="text-charcoal">{job.applicants}</td>
      <td className="text-charcoal">{job.views}</td>
      <td className="text-muted">{job.posted}</td>
      <td>
        <button className="icon-btn">
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
};

// Quick Action Card
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ title, description, icon, to }) => (
  <Link to={to} className="solid-card p-5 flex items-center gap-4 group">
    <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center text-navy group-hover:bg-navy group-hover:text-white transition-all duration-200">
      {icon}
    </div>
    <div>
      <h4 className="font-semibold text-charcoal group-hover:text-navy transition-colors">{title}</h4>
      <p className="text-sm text-muted">{description}</p>
    </div>
  </Link>
);

// Recent Applicant Card
interface Applicant {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  applied: string;
}

const ApplicantCard: React.FC<{ applicant: Applicant }> = ({ applicant }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy font-semibold">
      {applicant.name.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-charcoal truncate">{applicant.name}</p>
      <p className="text-xs text-muted">{applicant.role} • {applicant.applied}</p>
    </div>
  </div>
);

// Mock Data
const mockStats = {
  activeJobs: 12,
  totalApplicants: 74,
  totalViews: 2408,
  hires: 15,
};

const mockJobs: JobRow[] = [
  { id: 1, title: 'Commercial Electrician', status: 'open', applicants: 18, views: 432, posted: '2 days ago' },
  { id: 2, title: 'HVAC Technician', status: 'open', applicants: 9, views: 284, posted: '3 days ago' },
  { id: 3, title: 'Plumbing Crew Lead', status: 'open', applicants: 17, views: 512, posted: '5 days ago' },
  { id: 4, title: 'General Labor Supervisor', status: 'draft', applicants: 0, views: 11, posted: '1 week ago' },
  { id: 5, title: 'Senior Carpenter', status: 'closed', applicants: 24, views: 890, posted: '2 weeks ago' },
];

const mockApplicants: Applicant[] = [
  { id: 1, name: 'James Wilson', role: 'Electrician', applied: '2 hours ago' },
  { id: 2, name: 'Sarah Chen', role: 'HVAC Tech', applied: '5 hours ago' },
  { id: 3, name: 'Michael Brown', role: 'Plumber', applied: '1 day ago' },
  { id: 4, name: 'Emily Davis', role: 'Carpenter', applied: '2 days ago' },
];

const Dashboard = () => {
  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your hiring overview.</p>
        </div>
        <Link to="/employer/post-job">
          <button className="btn-primary">
            <PlusIcon className="w-5 h-5" />
            Post New Job
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="employer-grid employer-grid-4 mb-8">
        <StatCard 
          label="Active Jobs" 
          value={mockStats.activeJobs} 
          icon={<BriefcaseIcon className="w-6 h-6" />}
          trend={8.3}
          variant="gradient"
        />
        <StatCard 
          label="Total Applicants" 
          value={mockStats.totalApplicants} 
          icon={<UserGroupIcon className="w-6 h-6" />}
          trend={12.1}
        />
        <StatCard 
          label="Profile Views" 
          value={mockStats.totalViews.toLocaleString()} 
          icon={<EyeIcon className="w-6 h-6" />}
          trend={6.8}
        />
        <StatCard 
          label="Successful Hires" 
          value={mockStats.hires} 
          icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
          trend={4.5}
        />
      </div>

      {/* Main Content Grid */}
      <div className="employer-grid employer-grid-3 mb-8">
        {/* Jobs Table */}
        <div className="xl:col-span-2">
          <div className="solid-card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h3 className="section-title">Recent Job Postings</h3>
              <Link to="/employer/jobs" className="text-sm font-medium text-navy hover:underline">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="employer-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Status</th>
                    <th>Applicants</th>
                    <th>Views</th>
                    <th>Posted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {mockJobs.slice(0, 5).map((job) => (
                    <JobRow key={job.id} job={job} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Applicants */}
        <div className="solid-card">
          <div className="card-header flex items-center justify-between">
            <h3 className="section-title">Recent Applicants</h3>
            <Link to="/employer/applications" className="text-sm font-medium text-navy hover:underline">
              View all
            </Link>
          </div>
          <div className="card-body space-y-1">
            {mockApplicants.map((applicant) => (
              <ApplicantCard key={applicant.id} applicant={applicant} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h3 className="section-title mb-4">Quick Actions</h3>
        <div className="employer-grid employer-grid-3">
          <QuickActionCard
            title="Post a Job"
            description="Create a new job listing"
            icon={<PlusIcon className="w-6 h-6" />}
            to="/employer/post-job"
          />
          <QuickActionCard
            title="Review Applications"
            description="Check pending applications"
            icon={<UserGroupIcon className="w-6 h-6" />}
            to="/employer/applications"
          />
          <QuickActionCard
            title="Manage Workers"
            description="View your hired workers"
            icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
            to="/employer/workers"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
