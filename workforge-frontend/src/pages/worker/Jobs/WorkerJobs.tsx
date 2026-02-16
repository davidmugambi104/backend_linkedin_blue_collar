import React, { useState } from 'react';
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
import { Job } from '@types';
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
      <div className="text-center py-12">
        <BriefcaseIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load jobs
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{error?.message || 'Please try again'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Available Jobs</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Find and apply to jobs that match your skills
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Search */}
          <Input
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            placeholder="Search jobs..."
            value={filters.search || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFilterChange({ search: e.target.value })
            }
          />

          {/* Min Pay */}
          <Input
            type="number"
            placeholder="Min pay"
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
            placeholder="Max pay"
            leftIcon={<CurrencyDollarIcon className="h-5 w-5" />}
            value={filters.maxPay || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFilterChange({
                maxPay: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />

          {/* Sort By */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('newest')}
              className="flex-1"
            >
              Newest
            </Button>
            <Button
              variant={sortBy === 'pay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('pay')}
              className="flex-1"
            >
              Price
            </Button>
          </div>
        </div>
      </Card>

      {/* Jobs List or Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-24" />
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center">
          <BriefcaseIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No jobs found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your filters or check back later
          </p>
          <Button onClick={() => handleFilterChange({ search: '', minPay: undefined, maxPay: undefined })}>
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job: Job) => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="block">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                        <BriefcaseIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {job.employer?.company_name || 'Company'}
                        </p>
                      </div>
                    </div>

                    {/* Job Description */}
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {job.description}
                    </p>

                    {/* Job Meta */}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {job.address && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          {job.address}
                        </div>
                      )}
                      {job.pay_min && job.pay_max && (
                        <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                          <CurrencyDollarIcon className="h-4 w-4" />
                          {formatCurrency(job.pay_min)} - {formatCurrency(job.pay_max)}
                        </div>
                      )}
                      {job.created_at && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          Posted {formatDate(job.created_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Status Badge and CTA */}
                  <div className="flex flex-col items-start sm:items-end gap-3">
                    <Badge variant={job.status === JobStatus.OPEN ? 'success' : 'warning'}>
                      {job.status}
                    </Badge>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {pageIndex * pageSize + 1} to</div>
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