import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useWorkers } from '@hooks/useWorker';

export const FeaturedWorkers: React.FC = () => {
  const { data: workers, isLoading } = useWorkers();

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= rating ? (
              <StarSolidIcon className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 text-gray-300" />
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Skilled Workers
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Connect with verified professionals ready to bring your projects to life
          </p>
        </div>

        {/* Workers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-48" />
              </Card>
            ))}
          </div>
        ) : workers && workers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {workers.slice(0, 6).map((worker: any) => (
                <Link key={worker.id} to={`/workers/${worker.id}`}>
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer h-full border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500">
                    <div className="flex flex-col h-full">
                      {/* Profile Header */}
                      <div className="flex items-start gap-3 mb-4">
                        {worker.profile_picture ? (
                          <img
                            src={worker.profile_picture}
                            alt={worker.full_name}
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                            <UserCircleIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                            <span className="truncate">{worker.full_name}</span>
                            {worker.is_verified && (
                              <CheckBadgeIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                            )}
                          </h3>
                          {worker.title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {worker.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      {worker.average_rating > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          {renderStars(Math.round(worker.average_rating))}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {worker.average_rating.toFixed(1)}
                          </span>
                          {worker.total_ratings > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({worker.total_ratings})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bio */}
                      {worker.bio && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                          {worker.bio}
                        </p>
                      )}

                      {/* Details */}
                      <div className="mt-auto space-y-2">
                        {worker.address && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{worker.address}</span>
                          </div>
                        )}
                        {worker.hourly_rate && (
                          <div className="flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400">
                            <CurrencyDollarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>${worker.hourly_rate}/hour</span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {worker.skills && worker.skills.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex flex-wrap gap-1">
                            {worker.skills.slice(0, 3).map((skill: any) => (
                              <Badge key={skill.id} variant="info" className="text-xs">
                                {skill.skill?.name || `Skill ${skill.skill_id}`}
                              </Badge>
                            ))}
                            {worker.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{worker.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Button asChild size="lg" variant="outline">
                <Link to="/workers">
                  View All Workers
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <UserCircleIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No workers available at the moment</p>
          </div>
        )}
      </div>
    </section>
  );
};
