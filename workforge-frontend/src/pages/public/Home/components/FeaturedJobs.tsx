import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useJobs } from '@hooks/useJobs';
import { formatDate } from '@lib/utils/format';

export const FeaturedJobs: React.FC = () => {
  const { data: jobs, isLoading } = useJobs();

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Job Opportunities
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore the latest job openings from verified employers
          </p>
        </div>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-40" />
              </Card>
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {jobs.slice(0, 6).map((job: any) => (
                <Link key={job.id} to={`/jobs/${job.id}`}>
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer h-full border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500">
                    <div className="flex flex-col h-full">
                      {/* Title and Status */}
                      <div className="mb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {job.title}
                          </h3>
                          {job.status && (
                            <Badge variant="success" className="text-xs shrink-0">
                              {job.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {job.employer?.company_name || 'Company'}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 mb-4">
                        {job.address && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{job.address}</span>
                          </div>
                        )}
                        {(job.pay_min || job.pay_max) && (
                          <div className="flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400">
                            <CurrencyDollarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
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
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <BriefcaseIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{job.required_skill.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">
                        {job.description}
                      </p>

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Posted {formatDate(job.created_at)}</span>
                          {job.application_count !== undefined && (
                            <span>{job.application_count} applicants</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Button asChild size="lg" variant="outline">
                <Link to="/jobs">
                  View All Jobs
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <BriefcaseIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No jobs available at the moment</p>
          </div>
        )}
      </div>
    </section>
  );
};
