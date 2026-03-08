/**
 * Worker Jobs Page - Unified Design System Implementation
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon,
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
import { JobStatus } from '@types';
import { useJobsPage } from './useJobsPage';
import { formatDate, formatCurrency } from '@lib/utils/format';

export const WorkerJobs: React.FC = () => {
  const {
    filters,
    sortBy,
    jobs,
    isLoading,
    error,
    totalCount,
    pageIndex,
    pageSize,
    totalPages,
    handleFilterChange,
    handleSort,
    setPageIndex,
  } = useJobsPage();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <BriefcaseIcon className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load jobs
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {error?.message || 'Please try again'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Available Jobs
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Find and apply to jobs that match your skills
          </p>
        </div>
        {totalCount > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{totalCount}</span> jobs available
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
              placeholder="Search jobs by title or description..."
              value={filters.search || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFilterChange({ search: e.target.value })
              }
            />
          </div>

          {/* Min Pay */}
          <Input
            type="number"
            placeholder="Min pay (KES)"
            leftIcon={<CurrencyDollarIcon className="h-5 w-5" />}
            value={filters.minPay || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFilterChange({
                minPay: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />

          {/* Max Pay */}
          <Input
            type="number"
            placeholder="Max pay (KES)"
            leftIcon={<CurrencyDollarIcon className="h-5 w-5" />}
            value={filters.maxPay || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFilterChange({
                maxPay: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Sort by:</span>
          <Button
            variant={sortBy === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('newest')}
          >
            Newest First
          </Button>
          <Button
            variant={sortBy === 'pay' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('pay')}
          >
            Highest Pay
          </Button>
          <Button
            variant={sortBy === 'relevance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('relevance')}
          >
            Relevance
          </Button>
        </div>
      </Card>

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-32" />
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-8 lg:p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <BriefcaseIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No jobs found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Try adjusting your filters or check back later for new opportunities
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => handleFilterChange({ search: '', minPay: undefined, maxPay: undefined })}
            >
              Clear Filters
            </Button>
            <Button>
              Create Job Alert
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="block">
              <Card 
                className="p-4 lg:p-6 hover:shadow-lg transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-700"
                hoverable
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                  {/* Left: Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 lg:gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <BriefcaseIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      {/* Title & Company */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {job.employer?.company_name || 'Company'}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 ml-15">
                      {job.description}
                    </p>

                    {/* Meta Info */}
                    <div className="mt-4 flex flex-wrap items-center gap-3 lg:gap-4 text-sm">
                      {job.address && (
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{job.address}</span>
                        </div>
                      )}
                      {job.pay_min && job.pay_max && (
                        <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                          <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0" />
                          <span>{formatCurrency(job.pay_min)} - {formatCurrency(job.pay_max)}</span>
                        </div>
                      )}
                      {job.created_at && (
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                          <span>{formatDate(job.created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status & Action */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 lg:gap-4 lg:text-right flex-shrink-0">
                    <Badge 
                      variant={job.status === JobStatus.OPEN ? 'success' : 'warning'}
                      className="text-xs"
                    >
                      {job.status === JobStatus.OPEN ? 'Open' : job.status}
                    </Badge>
                    <Button size="sm" className="lg:w-auto">
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page <span className="font-medium text-gray-900 dark:text-white">{pageIndex + 1}</span> of{' '}
                <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                <span className="hidden sm:inline"> • </span>
                <span className="hidden sm:inline">Showing</span>
                <span className="sm:hidden"> </span>
                <span className="font-medium text-gray-900 dark:text-white">{totalCount}</span> total
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

export default WorkerJobs;
