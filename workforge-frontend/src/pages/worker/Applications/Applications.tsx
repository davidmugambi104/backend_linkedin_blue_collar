import React from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useApplicationsPage } from './useApplicationsPage';
import type { Application } from '@types';
import { formatDate, formatCurrency } from '@lib/utils/format';

const statusConfig = {
  pending: { variant: 'warning' as const, icon: ExclamationCircleIcon, label: 'Pending' },
  accepted: { variant: 'success' as const, icon: CheckCircleIcon, label: 'Accepted' },
  rejected: { variant: 'error' as const, icon: XCircleIcon, label: 'Rejected' },
  withdrawn: { variant: 'default' as const, icon: ClipboardDocumentCheckIcon, label: 'Withdrawn' },
};

export const WorkerApplications: React.FC = () => {
  const {
    filters,
    applications,
    isLoading,
    error,
    totalCount,
    pageIndex,
    pageSize,
    totalPages,
    handleFilterChange,
    setPageIndex,
  } = useApplicationsPage();

  if (error) {
    return (
      <div className="text-center py-12">
        <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load applications
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{error?.message || 'Please try again'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Applications</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track and manage your job applications
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Search */}
          <Input
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            placeholder="Search applications..."
            value={filters.search || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFilterChange({ search: e.target.value })
            }
          />

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleFilterChange({ status: e.target.value || undefined })
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={() => handleFilterChange({ search: '', status: undefined })}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Applications List or Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-24" />
            </Card>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardDocumentCheckIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No applications yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by browsing and applying to jobs that match your skills
          </p>
          <Link to="/worker/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application: Application) => {
            const status = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <Link
                key={application.id}
                to={`/worker/applications/${application.id}`}
                className="block"
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                          <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {application.job?.title || 'Job Title'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {application.job?.employer?.company_name || 'Company'}
                          </p>
                        </div>
                      </div>

                      {/* Job Meta */}
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {application.job?.address && (
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4" />
                            {application.job.address}
                          </div>
                        )}
                        {application.job?.pay_min && application.job?.pay_max && (
                          <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            {formatCurrency(application.job.pay_min)} -{' '}
                            {formatCurrency(application.job.pay_max)}
                          </div>
                        )}
                        {application.created_at && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            Applied {formatDate(application.created_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side: Status Badge */}
                    <div className="flex flex-col items-start sm:items-end gap-3">
                      <Badge variant={status.variant}>
                        <StatusIcon className="h-4 w-4 mr-1 inline" />
                        {status.label}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {pageIndex * pageSize + 1} to{' '}
                {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount} applications
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex(pageIndex - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageIndex === totalPages - 1}
                  onClick={() => setPageIndex(pageIndex + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerApplications;
