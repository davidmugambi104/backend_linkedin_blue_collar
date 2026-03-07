import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  StarIcon,
  FunnelIcon,
  UserCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useWorkers } from '@hooks/useWorker';
import { formatDate } from '@lib/utils/format';

const Workers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [minRate, setMinRate] = useState(searchParams.get('min_rate') || '');
  const [maxRate, setMaxRate] = useState(searchParams.get('max_rate') || '');
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {};
    if (searchTerm) params.search = searchTerm;
    if (minRate) params.min_rate = Number(minRate);
    if (maxRate) params.max_rate = Number(maxRate);
    if (minRating) params.min_rating = Number(minRating);
    if (location) params.location = location;
    return params;
  }, [searchTerm, minRate, maxRate, minRating, location]);

  const { data: workers, isLoading } = useWorkers(queryParams);

  const handleSearch = () => {
    const params: any = {};
    if (searchTerm) params.q = searchTerm;
    if (minRate) params.min_rate = minRate;
    if (maxRate) params.max_rate = maxRate;
    if (minRating) params.min_rating = minRating;
    if (location) params.location = location;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setMinRate('');
    setMaxRate('');
    setMinRating('');
    setLocation('');
    setSearchParams({});
  };

  const activeFiltersCount = [searchTerm, minRate, maxRate, minRating, location].filter(Boolean).length;

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Find Skilled Workers
          </h1>

          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -mt-2.5 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, skills, or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} size="lg">
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              size="lg"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mt-4 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <Input
                    type="text"
                    placeholder="City or address"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Hourly Rate ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minRate}
                    onChange={(e) => setMinRate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Hourly Rate ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={maxRate}
                    onChange={(e) => setMaxRate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Rating
                  </label>
                  <Select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="1">1+ Stars</option>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {workers?.length || 0}
                </span>{' '}
                workers found
              </>
            )}
          </p>
        </div>

        {/* Worker Listings */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-48" />
              </Card>
            ))}
          </div>
        ) : workers && workers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker: any) => (
              <Link key={worker.id} to={`/workers/${worker.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex flex-col h-full">
                    {/* Profile Picture and Verification */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {worker.profile_picture ? (
                          <img
                            src={worker.profile_picture}
                            alt={worker.full_name}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <UserCircleIcon className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {worker.full_name}
                            {worker.is_verified && (
                              <CheckBadgeIcon className="h-5 w-5 text-primary-600" />
                            )}
                          </h3>
                          {worker.title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {worker.title}
                            </p>
                          )}
                        </div>
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
                            ({worker.total_ratings} reviews)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bio */}
                    {worker.bio && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
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
                        <div className="flex items-center text-sm font-semibold text-gray-900 dark:text-white">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>${worker.hourly_rate}/hour</span>
                        </div>
                      )}
                      {worker.years_experience && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <span>{worker.years_experience} years experience</span>
                        </div>
                      )}
                      {worker.completed_jobs > 0 && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <span>{worker.completed_jobs} jobs completed</span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {worker.skills && worker.skills.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {worker.skills.slice(0, 3).map((skill: any) => (
                            <Badge key={skill.id} variant="info" className="text-xs">
                              {skill.skill?.name || `Skill ${skill.skill_id}`}
                            </Badge>
                          ))}
                          {worker.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{worker.skills.length - 3} more
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
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <UserCircleIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No workers found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your search criteria or filters
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Workers;
