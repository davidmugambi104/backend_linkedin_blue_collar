import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { Modal } from '@components/ui/Modal';
import { useJob, useApplyToJob } from '@hooks/useJobs';
import { useAuth } from '@context/AuthContext';
import { formatDate } from '@lib/utils/format';
import { toast } from 'react-toastify';
import { UserRole } from '@types';

// Match Jobs page heading style
const jobDetailHeadingStyle = `
  #job-detail-page h1,
  #job-detail-page h2,
  #job-detail-page h3,
  #job-detail-page h4,
  #job-detail-page h5,
  #job-detail-page h6 {
    font-family: 'Merriweather', serif;
  }
`;

const JobDetailBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div id="job-detail-page" className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 overflow-hidden">
    {/* Animated background elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl opacity-30 animate-blob" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl opacity-25 animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl opacity-25 animate-blob animation-delay-4000" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
    </div>

    <style>{jobDetailHeadingStyle}</style>
    <div className="relative z-10 min-h-screen">
      {children}
    </div>
  </div>
);

const JobDetail: React.FC = () => {
  const { id, jobId } = useParams<{ id?: string; jobId?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  const actualJobId = jobId || id;
  const { data: job, isLoading } = useJob(Number(actualJobId));
  const applyMutation = useApplyToJob();

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/jobs/${actualJobId}` } });
      return;
    }

    if (user?.role !== UserRole.WORKER) {
      toast.error('Only workers can apply to jobs');
      return;
    }

    try {
      await applyMutation.mutateAsync({
        jobId: Number(actualJobId),
        data: { cover_letter: coverLetter },
      });
      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      setCoverLetter('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    }
  };

  if (isLoading) {
    return (
      <JobDetailBackground>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96" />
        </div>
      </JobDetailBackground>
    );
  }

  if (!job) {
    return (
      <JobDetailBackground>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-12 text-center border border-gray-100 shadow-md rounded-xl bg-white/80 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Job Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/jobs">Browse All Jobs</Link>
            </Button>
          </Card>
        </div>
      </JobDetailBackground>
    );
  }

  return (
    <JobDetailBackground>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          asChild
          variant="outline"
          className="mb-6 bg-white/90 border-gray-200 text-gray-900 shadow-sm hover:bg-white"
        >
          <Link to="/jobs">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6 border border-gray-100 shadow-md rounded-xl bg-white/80 backdrop-blur-md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-slate-400" />
                    <span className="text-lg text-gray-600">
                      {job.employer?.company_name || 'Company'}
                    </span>
                  </div>
                </div>
                {job.status && (
                  <Badge variant="success" className="text-lg px-4 py-2">
                    {job.status}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-4 py-4 border-y border-gray-200">
                {job.address && (
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{job.address}</span>
                  </div>
                )}
                {(job.pay_min || job.pay_max) && (
                  <div className="flex items-center text-gray-900 font-semibold">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    <span>
                      {job.pay_min && job.pay_max
                        ? `$${job.pay_min} - $${job.pay_max}`
                        : job.pay_min
                        ? `$${job.pay_min}+`
                        : `Up to $${job.pay_max}`}
                      {job.pay_type && ` / ${job.pay_type}`}
                    </span>
                  </div>
                )}
                {job.required_skill?.name && (
                  <div className="flex items-center text-gray-600">
                    <BriefcaseIcon className="h-5 w-5 mr-2" />
                    <span>{job.required_skill.name}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  <span>Posted {formatDate(job.created_at)}</span>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Job Description
                </h2>
                <div className="prose max-w-none">
                  <p className="text-slate-700 whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6 border border-gray-100 shadow-md rounded-xl bg-white/80 backdrop-blur-md">
              <Button
                onClick={() => setShowApplyModal(true)}
                size="lg"
                className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Submitting...' : 'Apply Now'}
              </Button>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-500">Applicants</p>
                  <p className="font-semibold text-gray-900">
                    {job.application_count || 0} applied
                  </p>
                </div>
                {job.created_at && (
                  <div>
                    <p className="text-slate-500">Posted</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for this Job"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              You're applying for: <strong>{job.title}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cover Letter (Optional)
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleApply}
              disabled={applyMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowApplyModal(false)}
              disabled={applyMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </JobDetailBackground>
  );
};

export default JobDetail;

