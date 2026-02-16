import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { ApplicantCard } from './ApplicantCard';
import { useJobApplications, useUpdateApplicationStatus } from '@hooks/useEmployerApplications';
import { Skeleton } from '@components/ui/Skeleton';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ApplicationStatus } from '@types';

export const ApplicantsList: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data: applications, isLoading } = useJobApplications(Number(jobId));
  const updateStatus = useUpdateApplicationStatus();

  const filteredApplications = applications?.filter((app) => {
    const matchesSearch = 
      app.worker?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.cover_letter?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (applicationId: number, status: string) => {
    await updateStatus.mutateAsync({ applicationId, status });
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
        <CardHeader>
          <h3 className="text-xl font-semibold text-[#0F172A]">Applicants</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-[#F1F5F9]" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
      <CardHeader>
        <h3 className="text-xl font-semibold text-[#0F172A]">
          Applicants ({filteredApplications?.length || 0})
        </h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search applicants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5 text-[#64748B]" />}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-full focus:ring-[#2563EB] focus:border-[#2563EB]"
              />
            </div>
            <div className="sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg"
              >
                <option value="all">All Status</option>
                <option value={ApplicationStatus.PENDING}>Pending</option>
                <option value={ApplicationStatus.ACCEPTED}>Accepted</option>
                <option value={ApplicationStatus.REJECTED}>Rejected</option>
                <option value={ApplicationStatus.WITHDRAWN}>Withdrawn</option>
              </Select>
            </div>
          </div>

          {/* Applicants List */}
          <div className="space-y-4">
            {filteredApplications?.length === 0 ? (
              <p className="text-center text-[#64748B] py-8">
                No applicants found
              </p>
            ) : (
              filteredApplications?.map((application) => (
                <ApplicantCard
                  key={application.id}
                  application={application}
                  onStatusChange={(status) => handleStatusChange(application.id, status)}
                />
              ))
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};