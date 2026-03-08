import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { StarIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';

interface Applicant {
  id: number;
  name: string;
  title: string;
  rating: number;
  completedJobs: number;
  hourlyRate: number;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}

const JobDetail: React.FC = () => {
  const { id } = useParams();
  const [applicants, setApplicants] = useState<Applicant[]>([
    {
      id: 1,
      name: 'John Smith',
      title: 'Master Plumber',
      rating: 4.9,
      completedJobs: 156,
      hourlyRate: 75,
      status: 'pending',
      appliedAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      title: 'Electrical Specialist',
      rating: 4.8,
      completedJobs: 89,
      hourlyRate: 85,
      status: 'accepted',
      appliedAt: '2024-01-14',
    },
    {
      id: 3,
      name: 'Mike Davis',
      title: 'HVAC Technician',
      rating: 4.7,
      completedJobs: 67,
      hourlyRate: 65,
      status: 'rejected',
      appliedAt: '2024-01-13',
    },
  ]);

  const job = {
    id,
    title: 'Plumbing Installation & Repair',
    publishedAt: '2024-01-10',
    budget: '$500 - $1500',
    timeline: '3-5 days',
    location: 'New York, NY',
    description: 'We need an experienced plumber for a residential property renovation project. The main tasks include replacing old pipes, installing new fixtures, and ensuring all work meets local codes.',
    requirements: [
      'Licensed plumber with minimum 5 years experience',
      'Knowledge of residential and commercial systems',
      'Ability to read blueprints',
      'Valid driver\'s license',
      'Insurance and bonding',
    ],
    skills: ['Plumbing', 'Repairs', 'Installation', 'Code Compliance'],
    views: 284,
    applicants: applicants.length,
  };

  const handleApplicantAction = (applicantId: number, action: 'accept' | 'reject') => {
    setApplicants(applicants.map(app =>
      app.id === applicantId ? { ...app, status: action === 'accept' ? 'accepted' : 'rejected' } : app
    ));
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6 employer-fintech-panel">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">{job.title}</h1>
            <p className="text-[#64748B]">Posted on {job.publishedAt}</p>
          </div>
          <Button className="rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]">Edit Job</Button>
        </div>

        {/* Job Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E2E8F0]">
          <div>
            <p className="text-xs font-medium text-[#64748B] uppercase mb-1">Budget</p>
            <p className="text-lg font-semibold text-[#0F172A]">{job.budget}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#64748B] uppercase mb-1">Timeline</p>
            <p className="text-lg font-semibold text-[#0F172A]">{job.timeline}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#64748B] uppercase mb-1">Views</p>
            <p className="text-lg font-semibold text-[#0F172A]">{job.views}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#64748B] uppercase mb-1">Applicants</p>
            <p className="text-lg font-semibold text-[#0F172A]">{job.applicants}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Job Details */}
        <div className="col-span-2 space-y-6">
          {/* Location & Skills */}
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6 employer-fintech-panel">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-[#64748B]" />
                <span className="text-[#0F172A]">{job.location}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748B] mb-2 uppercase tracking-wide">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(skill => (
                    <Badge key={skill} variant="outline" className="border border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6 employer-fintech-panel">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-3">Job Description</h2>
            <p className="text-[#64748B] leading-relaxed">{job.description}</p>
          </Card>

          {/* Requirements */}
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6 employer-fintech-panel">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[#0F172A]">{req}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right Column - Applicants */}
        <div className="col-span-1">
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sticky top-6 employer-fintech-panel">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Applicants ({job.applicants})</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {applicants.map(applicant => (
                <div key={applicant.id} className="p-3 border border-[#E2E8F0] rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-[#0F172A] text-sm">{applicant.name}</h3>
                      <p className="text-xs text-[#64748B]">{applicant.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <StarIcon
                        key={star}
                        className={`h-3 w-3 ${
                          star <= Math.round(applicant.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-[#E2E8F0]'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-[#64748B] ml-1">{applicant.rating}</span>
                  </div>
                  <p className="text-xs text-[#64748B] mb-3">${applicant.hourlyRate}/hr • {applicant.completedJobs} jobs</p>
                  <div className="mb-2">{statusBadge(applicant.status)}</div>
                  {applicant.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApplicantAction(applicant.id, 'accept')}
                        className="flex-1 text-xs px-2 py-1 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E3A8A] transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleApplicantAction(applicant.id, 'reject')}
                        className="flex-1 text-xs px-2 py-1 border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:bg-[#F8FAFC] transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
