/**
 * Worker Applications Page - Unified Design System
 */
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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-red-100 bg-red-900/30 flex items-center justify-center mb-4">
          <ClipboardDocumentCheckIcon className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 text-[#1A1A1A] mb-2">
          Failed to load applications
        </h2>
        <p className="text-slate-500  mb-6">
          {error?.message || 'Please try again'}
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
            My Applications
          </h1>
          <p className="mt-1 text-slate-500 ">
            Track and manage your job applications
          </p>
        </div>
        {totalCount > 0 && (
          <div className="text-sm text-slate-500 ">
            <span className="font-medium text-gray-900 text-[#1A1A1A]">{totalCount}</span> total applications
          </div>
        )}
      </div>

      {/* Filters Card */}
      <Card className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Input
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              placeholder="Search by job title or company..."
              value={filters.search || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFilterChange({ search: e.target.value })
              }
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleFilterChange({ status: e.target.value || undefined })
            }
            className="
              h-10 w-full rounded-xl border px-4 py-2 text-sm
              bg-gradient-to-br from-white/30 to-white/10
              border-slate-300/50 text-slate-700
              from-black/30 to-black/10 border-slate-600/50 text-slate-200
              focus:ring-2 focus:ring-blue-500/70 focus:border-transparent
            "
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

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 lg:p-6">
              <Skeleton className="h-24" />
            </Card>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-8 lg:p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <ClipboardDocumentCheckIcon className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-[#1A1A1A] mb-2">
            No applications yet
          </h2>
          <p className="text-slate-500  mb-6 max-w-md mx-auto">
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
                to={application.job_id ? `/jobs/${application.job_id}` : '/worker/applications'}
                className="block"
              >
                <Card 
                  className="p-4 lg:p-6 hover:shadow-lg transition-all duration-200 hover:border-primary-300 hover:border-primary-700"
                  hoverable
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                    {/* Left: Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 lg:gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 bg-blue-900/30 flex items-center justify-center">
                          <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 text-[#1A1A1A] truncate">
                            {application.job?.title || 'Job Title'}
                          </h3>
                          <p className="text-sm text-slate-500  mt-0.5">
                            {application.job?.employer?.company_name || 'Company'}
                          </p>
                        </div>
                      </div>

                      {/* Job Meta */}
                      <div className="mt-4 flex flex-wrap items-center gap-3 lg:gap-4 text-sm">
                        {application.job?.address && (
                          <div className="flex items-center gap-1.5 text-slate-500 ">
                            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{application.job.address}</span>
                          </div>
                        )}
                        {application.job?.pay_min && application.job?.pay_max && (
                          <div className="flex items-center gap-1.5 font-medium text-gray-900 text-[#1A1A1A]">
                            <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0" />
                            {formatCurrency(application.job.pay_min)} - {formatCurrency(application.job.pay_max)}
                          </div>
                        )}
                        {application.created_at && (
                          <div className="flex items-center gap-1.5 text-slate-500 ">
                            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                            Applied {formatDate(application.created_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Action */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 lg:gap-4 lg:text-right flex-shrink-0">
                      <Badge variant={status.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </Badge>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 border-gray-700">
              <div className="text-sm text-slate-500 ">
                Page <span className="font-medium text-gray-900 text-[#1A1A1A]">{pageIndex + 1}</span> of{' '}
                <span className="font-medium text-gray-900 text-[#1A1A1A]">{totalPages}</span>
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
