import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon,
  PencilIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CalendarIcon,
  CheckBadgeIcon,
  StarIcon,
  BriefcaseIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { useEmployerProfile, useEmployerStats } from '@hooks/useEmployer';
import { useEmployerJobs } from '@hooks/useEmployerJobs';
import { toast } from 'react-toastify';

// Section Title
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-lg font-semibold text-charcoal mb-4">{children}</h3>
);

// Info Item
const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-charcoal mt-0.5">{value}</p>
    </div>
  </div>
);

// Stat Box
const StatBox: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="text-center p-4">
    <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center text-navy mx-auto mb-3">
      {icon}
    </div>
    <p className="text-2xl font-bold text-charcoal">{value}</p>
    <p className="text-sm text-muted mt-1">{label}</p>
  </div>
);

// Team Member Card
interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar?: string;
}

const TeamMemberCard: React.FC<{ member: TeamMember }> = ({ member }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-charcoal-50 transition-colors">
    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy font-semibold text-sm">
      {member.name.split(' ').map(n => n[0]).join('')}
    </div>
    <div>
      <p className="font-medium text-charcoal">{member.name}</p>
      <p className="text-xs text-muted">{member.role}</p>
    </div>
  </div>
);

// Job Listing Preview
interface JobPreview {
  id: number;
  title: string;
  applicants: number;
  status: string;
}

const JobPreviewCard: React.FC<{ job: JobPreview }> = ({ job }) => (
  <Link to={`/employer/jobs/${job.id}`} className="flex items-center justify-between p-3 border border-charcoal-100 rounded-lg hover:border-navy/30 hover:bg-navy-50/30 transition-all cursor-pointer">
    <div>
      <p className="font-medium text-charcoal">{job.title}</p>
      <p className="text-xs text-muted">{job.applicants} applicants</p>
    </div>
    <span className={`badge ${job.status === 'Open' ? 'badge-success' : 'badge-neutral'}`}>
      {job.status}
    </span>
  </Link>
);

// Profile Page
const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { data: profile } = useEmployerProfile();
  const { data: stats } = useEmployerStats();
  const { data: jobs = [] } = useEmployerJobs();

  const companyInfo = {
    name: profile?.company_name || 'Company',
    tagline: 'Employer profile',
    industry: 'Construction & Engineering',
    size: '—',
    location: profile?.address || 'Location not set',
    founded: profile?.created_at ? new Date(profile.created_at).getFullYear().toString() : '—',
    website: profile?.website || 'Not set',
    email: 'Use account email',
    phone: profile?.phone || 'Not set',
    description: profile?.description || 'No company description provided.',
    rating: 0,
    reviews: stats?.reviews_given || 0,
    verified: Boolean(profile?.verification_score && profile.verification_score > 70),
  };

  const teamMembers: TeamMember[] = [
    { id: 1, name: 'John Smith', role: 'CEO & Founder' },
    { id: 2, name: 'Sarah Johnson', role: 'Operations Manager' },
    { id: 3, name: 'Mike Williams', role: 'Project Director' },
    { id: 4, name: 'Emily Davis', role: 'HR Manager' },
  ];

  const activeJobs: JobPreview[] = jobs.slice(0, 3).map((job) => ({
    id: job.id,
    title: job.title,
    applicants: job.application_count || 0,
    status: String(job.status || 'Open'),
  }));

  const openSettingsProfile = () => {
    setIsEditing(false);
    navigate('/employer/settings');
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/employer/profile`;
    await navigator.clipboard.writeText(profileUrl);
    toast.success('Profile link copied to clipboard');
  };

  const handleSocialMedia = () => {
    if (companyInfo.website && companyInfo.website !== 'Not set') {
      const url = companyInfo.website.startsWith('http') ? companyInfo.website : `https://${companyInfo.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    toast.info('Add a website in Settings to enable this link.');
  };

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Company Profile</h1>
          <p className="page-subtitle">Manage your public profile and company information</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleShareProfile} className="btn-secondary">
            <EyeIcon className="w-5 h-5" />
            Preview
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="btn-primary"
          >
            <PencilIcon className="w-5 h-5" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Header Card */}
          <div className="solid-card overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-navy-700 to-navy-800 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-30"></div>
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-end gap-5 -mt-12 mb-4">
                <div className="w-24 h-24 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg">
                  WF
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-charcoal">{companyInfo.name}</h2>
                    {companyInfo.verified && (
                      <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-muted">{companyInfo.tagline}</p>
                </div>
              </div>
              
              <p className="text-charcoal mb-4">{companyInfo.description}</p>
              
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  {companyInfo.industry}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <UsersIcon className="w-4 h-4" />
                  {companyInfo.size}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <MapPinIcon className="w-4 h-4" />
                  {companyInfo.location}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <CalendarIcon className="w-4 h-4" />
                  Founded {companyInfo.founded}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="solid-card p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Contact Information</SectionTitle>
              <button type="button" onClick={openSettingsProfile} className="text-sm text-navy font-medium hover:underline">Edit</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem 
                icon={<EnvelopeIcon className="w-5 h-5" />}
                label="Email"
                value={companyInfo.email}
              />
              <InfoItem 
                icon={<PhoneIcon className="w-5 h-5" />}
                label="Phone"
                value={companyInfo.phone}
              />
              <InfoItem 
                icon={<GlobeAltIcon className="w-5 h-5" />}
                label="Website"
                value={companyInfo.website}
              />
              <InfoItem 
                icon={<MapPinIcon className="w-5 h-5" />}
                label="Address"
                value={companyInfo.location}
              />
            </div>
          </div>

          {/* Active Job Postings */}
          <div className="solid-card p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Active Job Postings</SectionTitle>
              <Link to="/employer/jobs" className="text-sm text-navy font-medium hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <JobPreviewCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Team */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="solid-card p-6">
            <SectionTitle>Performance</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <StatBox 
                label="Rating"
                value={companyInfo.rating.toString()}
                icon={<StarIcon className="w-6 h-6" />}
              />
              <StatBox 
                label="Reviews"
                value={companyInfo.reviews.toString()}
                icon={<UsersIcon className="w-6 h-6" />}
              />
              <StatBox 
                label="Active Jobs"
                value={String(stats?.job_status_counts?.open || 0)}
                icon={<BriefcaseIcon className="w-6 h-6" />}
              />
              <StatBox 
                label="Hires"
                value={String(stats?.application_status_counts?.accepted || 0)}
                icon={<CheckBadgeIcon className="w-6 h-6" />}
              />
            </div>
          </div>

          {/* Team Members */}
          <div className="solid-card p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Team</SectionTitle>
              <button type="button" onClick={openSettingsProfile} className="text-sm text-navy font-medium hover:underline">Add</button>
            </div>
            <div className="space-y-1">
              {teamMembers.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="solid-card p-6">
            <SectionTitle>Quick Links</SectionTitle>
            <div className="space-y-3">
              <button type="button" onClick={handleShareProfile} className="w-full flex items-center justify-between p-3 rounded-lg border border-charcoal-200 hover:border-navy hover:bg-navy-50/30 transition-all">
                <span className="flex items-center gap-3 text-sm font-medium text-charcoal">
                  <LinkIcon className="w-5 h-5 text-muted" />
                  Share Profile Link
                </span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-muted" />
              </button>
              <button type="button" onClick={handleSocialMedia} className="w-full flex items-center justify-between p-3 rounded-lg border border-charcoal-200 hover:border-navy hover:bg-navy-50/30 transition-all">
                <span className="flex items-center gap-3 text-sm font-medium text-charcoal">
                  <LinkIcon className="w-5 h-5 text-muted" />
                  Social Media
                </span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
