import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { employerService } from '@services/employer.service';
import { Worker } from '@types';

const Workers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  // Fetch workers from API
  const { data: workers = [], isLoading, isError, error } = useQuery({
    queryKey: ['workerSearch', { skill: skillFilter }],
    queryFn: () => employerService.searchWorkers({ skill_id: skillFilter || undefined }),
  });

  // Filter workers by search query
  const filteredWorkers = useMemo(() => {
    return workers.filter(worker =>
      worker.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (worker.title && worker.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [workers, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Browse Workers</h1>
        <p className="mt-2 text-[#64748B]">Find skilled workers for your projects</p>
      </div>

      {/* Search & Filter */}
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-[#64748B]" />
            <Input
              placeholder="Search by name, title, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full focus:ring-[#2563EB] focus:border-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[#0F172A]">Filter by Skill</label>
            <p className="text-xs text-[#64748B] mb-2">
              Note: Build filters for {skillFilter || 'all skills'}
            </p>
            {/* Skill filter can be expanded with a separate skill selection UI */}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center">
          <p className="text-[#64748B]">Loading workers...</p>
        </Card>
      )}

      {/* Error State */}
      {isError && error && (
        <Card className="bg-white border border-red-200 rounded-2xl p-6">
          <p className="text-red-600">Error loading workers: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </Card>
      )}

      {/* Workers Grid */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWorkers.map(worker => (
            <Card key={worker.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="h-16 w-16 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] text-xl font-semibold">
                    {worker.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-[#0F172A]">{worker.full_name}</h3>
                      {worker.is_verified && (
                        <Badge variant="success" className="text-xs">Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating & Stats */}
              <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(worker.average_rating || 0) ? 'text-yellow-400' : 'text-[#E2E8F0]'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-[#0F172A] ml-1">
                    {(worker.average_rating || 0).toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-[#64748B]">
                  {worker.total_ratings || 0} {(worker.total_ratings || 0) === 1 ? 'rating' : 'ratings'}
                </span>
              </div>

              {/* Location & Rate */}
              <div className="space-y-3 mb-4">
                {worker.address && (
                  <div className="flex items-center space-x-2 text-[#64748B]">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="text-sm">{worker.address}</span>
                  </div>
                )}
                {worker.hourly_rate && (
                  <p className="text-lg font-semibold text-[#0F172A]">${parseFloat(String(worker.hourly_rate)).toFixed(2)}/hr</p>
                )}
              </div>

              {/* Skills */}
              {worker.skills && worker.skills.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill: any) => (
                      <Badge key={skill.id} className="text-xs bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]">View Profile</Button>
                <Button className="flex-1 rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95">Hire Now</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !isError && filteredWorkers.length === 0 && (
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center">
          <p className="text-[#64748B]">No workers found matching your criteria</p>
        </Card>
      )}
    </div>
  );
};

export default Workers;
