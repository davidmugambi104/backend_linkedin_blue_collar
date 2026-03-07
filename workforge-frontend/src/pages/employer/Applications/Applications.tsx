/**
 * Employer Applications Page - Unified Design System
 */
import React, { useState, useMemo } from 'react';
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useEmployerApplications, useUpdateApplicationStatus } from '@hooks/useEmployer';
import { Application } from '@types';
import { formatDate } from '@lib/utils/format';

const statusConfig = {
  pending: { variant: 'warning' as const, label: 'Pending' },
  accepted: { variant: 'success' as const, label: 'Accepted' },
  rejected: { variant: 'error' as const, label: 'Rejected' },
  withdrawn: { variant: 'default' as const, label: 'Withdrawn' },
};

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

  // Stats
  const stats = [
    { label: 'Total', value: applications.length, color: 'blue' },
    { label: 'Pending', value: applications.filter(a => a.status === 'pending').length, color: 'amber' },
    { label: 'Accepted', value: applications.filter(a => a.status === 'accepted').length, color: 'green' },
    { label: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, color: 'red' },
  ];

  const getStatusVariant = (status: string) => statusConfig[status as keyof typeof statusConfig]?.variant || 'default';

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <UsersIcon className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load applications
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {error instanceof Error ? error.message : 'Please try again'}
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Applications
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Review and manage job applications
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx} className="p-4 lg:p-6" hoverable>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Filter Tabs */}
          <Card className="p-2">
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'accepted', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`
                    px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
                    ${filterStatus === status
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
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
              {filteredApplications.length === 0 ? (
                <Card className="p-8 lg:p-12 text-center">
                  <UsersIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No applications found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Applications will appear here when workers apply to your jobs
                  </p>
                </Card>
              ) : (
                filteredApplications.map(application => (
                  <Card
                    key={application.id}
                    className={`
                      p-4 lg:p-6 cursor-pointer transition-all duration-200 hover:shadow-lg
                      ${selectedAppId === application.id ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                    `}
                    onClick={() => setSelectedAppId(application.id)}
                    hoverable
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {application.worker?.full_name || 'Unknown Worker'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {application.worker?.address || 'Location not set'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Applied for: <span className="font-medium text-gray-900 dark:text-white">{application.job?.title || 'Unknown Job'}</span>
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(application.status)}>
                        {application.status}
                      </Badge>
                    </div>

                    {/* Rating */}
                    <div className="mt-4 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <StarIcon
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(application.worker?.average_rating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {application.worker?.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Selected Application Detail */}
            <div className="lg:col-span-1">
              {selectedApp ? (
                <Card className="p-4 lg:p-6 sticky top-24">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Application Details
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Worker Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {selectedApp.worker?.full_name || 'Unknown'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedApp.worker?.years_experience || 0} years experience
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <StarIcon
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(selectedApp.worker?.average_rating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({selectedApp.worker?.total_jobs_completed || 0} jobs completed)
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {selectedApp.worker?.user?.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <PhoneIcon className="h-4 w-4" />
                          {selectedApp.worker.user.phone}
                        </div>
                      )}
                      {selectedApp.worker?.user?.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <EnvelopeIcon className="h-4 w-4" />
                          {selectedApp.worker.user.email}
                        </div>
                      )}
                    </div>

                    {/* Cover Note */}
                    {selectedApp.cover_note && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Note</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedApp.cover_note}</p>
                      </div>
                    )}

                    {/* Applied Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4" />
                      Applied {formatDate(selectedApp.created_at)}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {selectedApp.status === 'pending' && (
                        <>
                          <Button
                            className="w-full"
                            leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                            onClick={() => handleUpdateStatus(selectedApp.id, 'accepted')}
                            isLoading={updateApplicationMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            className="w-full"
                            leftIcon={<XCircleIcon className="h-5 w-5" />}
                            onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                            isLoading={updateApplicationMutation.isPending}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {selectedApp.status !== 'pending' && (
                        <Badge variant={getStatusVariant(selectedApp.status)} className="w-full justify-center py-2">
                          {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 text-center">
                  <UsersIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select an application to view details
                  </p>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Applications;
