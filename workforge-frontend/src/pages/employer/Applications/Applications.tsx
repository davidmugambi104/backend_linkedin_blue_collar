import React, { useState, useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon, StarIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useEmployerApplications, useUpdateApplicationStatus } from '@hooks/useEmployer';
import { Application } from '@types';

const Applications: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

  // Fetch applications
  const { data: applications = [], isLoading, error } = useEmployerApplications(
    filterStatus !== 'all' ? filterStatus : undefined
  );

  // Update application status mutation
  const updateApplicationMutation = useUpdateApplicationStatus();

  // Filter applications
  const filteredApplications = useMemo(() => {
    if (filterStatus === 'all') {
      return applications;
    }
    return applications.filter(app => app.status === filterStatus);
  }, [applications, filterStatus]);

  const selectedApp = selectedAppId ? applications.find(app => app.id === selectedAppId) : null;

  const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
    await updateApplicationMutation.mutateAsync({
      applicationId,
      status: newStatus,
    });
    setSelectedAppId(null);
  };

  const statusBadge = (status: string) => {
    const classMap: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-600',
      accepted: 'bg-green-50 text-green-600',
      rejected: 'bg-red-50 text-red-600',
      withdrawn: 'bg-slate-50 text-slate-600',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
          classMap[status] || 'bg-slate-50 text-slate-600'
        }`}
      >
        {status}
      </span>
    );
  };

  const stats = [
    { label: 'Total Applications', value: applications.length },
    { label: 'Pending', value: applications.filter(a => a.status === 'pending').length },
    { label: 'Accepted', value: applications.filter(a => a.status === 'accepted').length },
    { label: 'Rejected', value: applications.filter(a => a.status === 'rejected').length },
    { label: 'Withdrawn', value: applications.filter(a => a.status === 'withdrawn').length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Applications</h1>
        <p className="mt-2 text-[#64748B]">Review and manage job applications</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center">
          <p className="text-[#64748B]">Loading applications...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-white border border-red-200 rounded-2xl p-6">
          <p className="text-red-600">Error loading applications: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx} className="bg-[#F8FAFC] rounded-2xl p-6">
                <p className="text-sm font-medium text-[#64748B] mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-[#0F172A]">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Filter */}
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'accepted', 'rejected', 'withdrawn'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    filterStatus === status
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </Card>

          {/* Applications Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Applications List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredApplications.map(application => (
                <Card
                  key={application.id}
                  className={`bg-white border border-[#E2E8F0] rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    selectedAppId === application.id
                      ? 'ring-2 ring-[#2563EB]'
                      : ''
                  }`}
                  onClick={() => setSelectedAppId(application.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-[#0F172A]">
                          {application.worker?.full_name || 'Unknown Worker'}
                        </h3>
                        {statusBadge(application.status)}
                      </div>
                      <p className="text-sm text-[#64748B]">{application.worker?.address || 'Location unknown'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#64748B] mb-3">
                    Applied for <span className="font-medium text-[#0F172A]">{application.job?.title || 'Unknown Job'}</span>
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-[#64748B]">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <StarIcon
                          key={star}
                          className={`h-3 w-3 ${
                            star <= Math.round(application.worker?.average_rating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-[#E2E8F0]'
                          }`}
                        />
                      ))}
                      <span className="ml-1">{(application.worker?.average_rating || 0).toFixed(1)}</span>
                    </div>
                    <span>{application.worker?.total_ratings || 0} ratings</span>
                    {application.worker?.hourly_rate && <span>${parseFloat(String(application.worker.hourly_rate)).toFixed(2)}/hr</span>}
                  </div>
                </Card>
              ))}
              {filteredApplications.length === 0 && (
                <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
                  <p className="text-[#64748B]">No applications found</p>
                </Card>
              )}
            </div>

            {/* Application Detail */}
            {selectedApp && (
              <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sticky top-6 h-fit">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0F172A] mb-2">
                      {selectedApp.worker?.full_name || 'Unknown Worker'}
                    </h2>
                    <p className="text-[#64748B] mb-2">{selectedApp.worker?.address}</p>
                    {statusBadge(selectedApp.status)}
                  </div>

                  {/* Worker Info */}
                  <div className="border-t border-[#E2E8F0] pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-[#64748B] mb-1">Rating</p>
                        <p className="font-bold text-[#0F172A]">{(selectedApp.worker?.average_rating || 0).toFixed(1)}/5</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#64748B] mb-1">Total Ratings</p>
                        <p className="font-bold text-[#0F172A]">{selectedApp.worker?.total_ratings || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#64748B] mb-1">Hourly Rate</p>
                        <p className="font-bold text-[#0F172A]">
                          ${selectedApp.worker?.hourly_rate ? parseFloat(String(selectedApp.worker.hourly_rate)).toFixed(2) : '0.00'}/hr
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#64748B] mb-1">Applied</p>
                        <p className="font-bold text-[#0F172A]">
                          {selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {selectedApp.cover_letter && (
                    <div className="border-t border-[#E2E8F0] pt-4">
                      <p className="text-xs font-medium text-[#64748B] mb-2 uppercase tracking-wide">Cover Message</p>
                      <p className="text-sm text-[#0F172A] leading-relaxed">{selectedApp.cover_letter}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-[#E2E8F0] pt-4 space-y-2">
                    {selectedApp.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleUpdateStatus(selectedApp.id, 'accepted')}
                          className="w-full rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95"
                          disabled={updateApplicationMutation.isPending}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                          variant="outline"
                          className="w-full rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                          disabled={updateApplicationMutation.isPending}
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Applications;
