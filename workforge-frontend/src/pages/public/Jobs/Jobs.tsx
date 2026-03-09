import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useJobs } from '@hooks/useJobs';
import { formatDate } from '@lib/utils/format';
import { JOB_CATEGORIES, JOB_TYPES, LOCATION_RADIUS_OPTIONS } from '@config/constants';

// Apply Merriweather font to all headings in this component
const grapeNutsStyle = `
  #jobs-page h1,
  #jobs-page h2,
  #jobs-page h3,
  #jobs-page h4,
  #jobs-page h5,
  #jobs-page h6 {
    font-family: 'Merriweather', serif;
  }
`;

// ============================================================================
// Types
// ============================================================================

interface Job {
  id: string | number;
  title: string;
  status?: string;
  employer?: {
    company_name?: string;
  };
  address?: string;
  pay_min?: number;
  pay_max?: number;
  pay_type?: string;
  required_skill?: {
    name?: string;
  };
  description: string;
  created_at: string;
  application_count?: number;
}

interface JobFilters {
  title?: string;
  category?: string;
  type?: string;
  pay_min?: number;
  pay_max?: number;
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Manages filter state and synchronizes with URL search params.
 */
const useJobFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [minPay, setMinPay] = useState(searchParams.get('min_pay') || '');
  const [maxPay, setMaxPay] = useState(searchParams.get('max_pay') || '');

  const activeFiltersCount = useMemo(
    () => [searchTerm, selectedCategory, selectedType, minPay, maxPay].filter(Boolean).length,
    [searchTerm, selectedCategory, selectedType, minPay, maxPay]
  );

  const applyFilters = useCallback(() => {
    const params: Record<string, string> = {};
    if (searchTerm) params.q = searchTerm;
    if (selectedCategory) params.category = selectedCategory;
    if (selectedType) params.type = selectedType;
    if (minPay) params.min_pay = minPay;
    if (maxPay) params.max_pay = maxPay;
    setSearchParams(params);
  }, [searchTerm, selectedCategory, selectedType, minPay, maxPay, setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedType('');
    setMinPay('');
    setMaxPay('');
    setSearchParams({});
  }, [setSearchParams]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    minPay,
    setMinPay,
    maxPay,
    setMaxPay,
    activeFiltersCount,
    applyFilters,
    clearFilters,
  };
};

/**
 * Fetches jobs based on current URL search params.
 */
const useJobResults = () => {
  const [searchParams] = useSearchParams();

  const queryParams = useMemo<JobFilters>(() => {
    const params: JobFilters = {};
    const q = searchParams.get('q');
    if (q) params.title = q;
    const category = searchParams.get('category');
    if (category) params.category = category;
    const type = searchParams.get('type');
    if (type) params.type = type;
    const minPay = searchParams.get('min_pay');
    if (minPay) params.pay_min = Number(minPay);
    const maxPay = searchParams.get('max_pay');
    if (maxPay) params.pay_max = Number(maxPay);
    return params;
  }, [searchParams]);

  const { data: jobs, isLoading, error } = useJobs(queryParams);

  return { jobs, isLoading, error };
};

// ============================================================================
// Subcomponents
// ============================================================================

interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: () => void;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  showFilters: boolean;
}

// Add rotation animation for search icon
const searchAnimationStyle = `
  @keyframes rotate-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .search-icon-rotating {
    animation: rotate-spin 1s linear infinite;
    color: white;
  }

  @keyframes wave {
    0% { d: path('M 0,10 Q 2.5,5 5,10 T 10,10 T 15,10 T 20,10 T 25,10 T 30,10 T 35,10 T 40,10 T 45,10 T 50,10 T 55,10 T 60,10 T 65,10 T 70,10 T 75,10 T 80,10 T 85,10 T 90,10 T 95,10 T 100,10 T 105,10'); }
    50% { d: path('M 0,5 Q 2.5,10 5,5 T 10,5 T 15,5 T 20,5 T 25,5 T 30,5 T 35,5 T 40,5 T 45,5 T 50,5 T 55,5 T 60,5 T 65,5 T 70,5 T 75,5 T 80,5 T 85,5 T 90,5 T 95,5 T 100,5 T 105,5'); }
    100% { d: path('M 0,10 Q 2.5,5 5,10 T 10,10 T 15,10 T 20,10 T 25,10 T 30,10 T 35,10 T 40,10 T 45,10 T 50,10 T 55,10 T 60,10 T 65,10 T 70,10 T 75,10 T 80,10 T 85,10 T 90,10 T 95,10 T 100,10 T 105,10'); }
  }

  .filter-btn-wavy {
    position: relative;
    overflow: visible;
  }

  .filter-btn-wavy::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 0;
    right: 0;
    height: 8px;
    background: linear-gradient(135deg, 
      rgb(37, 99, 235) 0%, 
      rgb(37, 99, 235) 50%, 
      white 50%, 
      white 100%);
    -webkit-mask-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><path d="M 0,12 Q 3,7 6,12 T 12,12 T 18,12 T 24,12 T 30,12 T 36,12 T 42,12 T 48,12 T 54,12 T 60,12 T 66,12 T 72,12 T 78,12 T 84,12 T 90,12 T 96,12 T 102,12 T 108,12 T 114,12 T 120,12 L 120,20 L 0,20 Z" fill="black"/></svg>');
    -webkit-mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><path d="M 0,12 Q 3,7 6,12 T 12,12 T 18,12 T 24,12 T 30,12 T 36,12 T 42,12 T 48,12 T 54,12 T 60,12 T 66,12 T 72,12 T 78,12 T 84,12 T 90,12 T 96,12 T 102,12 T 108,12 T 114,12 T 120,12 L 120,20 L 0,20 Z" fill="black"/></svg>');
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
    opacity: 0;
    transform: translateY(-4px);
    transition: all 0.3s ease;
  }

  .filter-btn-wavy:hover::after {
    opacity: 1;
    transform: translateY(0);
  }
`;

const SearchBar: React.FC<SearchBarProps> = React.memo(({
  searchTerm,
  onSearchTermChange,
  onSearch,
  onToggleFilters,
  activeFiltersCount,
  showFilters,
}) => {
  const [isTyping, setIsTyping] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  }, [onSearch]);

  const handleInputChange = useCallback((value: string) => {
    onSearchTermChange(value);
    setIsTyping(value.length > 0);
  }, [onSearchTermChange]);

  return (
    <>
      <style>{searchAnimationStyle}</style>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -mt-2.5 h-5 w-5 text-slate-400" />
          {isTyping && (
            <MagnifyingGlassIcon className={`absolute right-4 top-1/2 -mt-2.5 h-5 w-5 search-icon-rotating`} />
          )}
          <Input
            type="text"
            placeholder="Search jobs by title, skills, or keywords..."
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 py-3 text-base rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 w-full"
            aria-label="Search jobs"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSearch}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm transition-colors"
            aria-label="Search"
          >
            Search
          </Button>
          <Button
            variant="outline"
            onClick={onToggleFilters}
            size="lg"
            className="filter-btn-wavy border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg shadow-sm transition-colors"
            aria-expanded={showFilters}
            aria-label="Toggle filters"
          >
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-800 border-0">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </>
  );
});

SearchBar.displayName = 'SearchBar';

interface FilterPanelProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  minPay: string;
  onMinPayChange: (value: string) => void;
  maxPay: string;
  onMaxPayChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = React.memo(({
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  minPay,
  onMinPayChange,
  maxPay,
  onMaxPayChange,
  onApply,
  onClear,
}) => {
  const handleMinPayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) onMinPayChange(value);
  }, [onMinPayChange]);

  const handleMaxPayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) onMaxPayChange(value);
  }, [onMaxPayChange]);

  return (
    <Card className="mt-6 p-6 border border-gray-100 shadow-md rounded-xl" aria-label="Filter panel">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
            Category
          </label>
          <Select
            id="category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {JOB_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="jobType" className="block text-sm font-medium text-slate-700 mb-2">
            Job Type
          </label>
          <Select
            id="jobType"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {JOB_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="minPay" className="block text-sm font-medium text-slate-700 mb-2">
            Min Pay ($)
          </label>
          <Input
            id="minPay"
            type="number"
            min="0"
            placeholder="0"
            value={minPay}
            onChange={handleMinPayChange}
            className="rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            aria-label="Minimum pay"
          />
        </div>

        <div>
          <label htmlFor="maxPay" className="block text-sm font-medium text-slate-700 mb-2">
            Max Pay ($)
          </label>
          <Input
            id="maxPay"
            type="number"
            min="0"
            placeholder="Any"
            value={maxPay}
            onChange={handleMaxPayChange}
            className="rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            aria-label="Maximum pay"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={onApply}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-sm transition-colors"
        >
          Apply Filters
        </Button>
        <Button
          variant="outline"
          onClick={onClear}
          className="border-gray-300 hover:bg-gray-50 px-5 py-2 rounded-lg shadow-sm transition-colors"
        >
          Clear All
        </Button>
      </div>
    </Card>
  );
});

FilterPanel.displayName = 'FilterPanel';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = React.memo(({ job }) => {
  const companyName = job.employer?.company_name || 'Company';
  const payRange = useMemo(() => {
    if (job.pay_min && job.pay_max) {
      return `$${job.pay_min} - $${job.pay_max}`;
    } else if (job.pay_min) {
      return `$${job.pay_min}+`;
    } else if (job.pay_max) {
      return `Up to $${job.pay_max}`;
    }
    return null;
  }, [job.pay_min, job.pay_max]);

  return (
    <Link to={`/jobs/${job.id}`} className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl">
      <Card className="p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-white rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {job.title}
              </h3>
              {job.status && (
                <Badge variant="success" className="bg-green-100 text-green-800 border-0">
                  {job.status}
                </Badge>
              )}
            </div>

            <p className="text-gray-600 mt-1">
              {companyName}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
              {job.address && (
                <span className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1 text-slate-400" />
                  {job.address}
                </span>
              )}
              {payRange && (
                <span className="flex items-center font-medium text-gray-900">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1 text-slate-400" />
                  {payRange}
                  {job.pay_type && ` / ${job.pay_type}`}
                </span>
              )}
              {job.required_skill?.name && (
                <span className="flex items-center">
                  <BriefcaseIcon className="h-4 w-4 mr-1 text-slate-400" />
                  {job.required_skill.name}
                </span>
              )}
            </div>

            <p className="mt-4 text-slate-700 line-clamp-2">
              {job.description}
            </p>

            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <span>Posted {formatDate(job.created_at)}</span>
              {job.application_count !== undefined && (
                <span>{job.application_count} applicants</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

JobCard.displayName = 'JobCard';

interface ResultsHeaderProps {
  isLoading: boolean;
  jobCount: number;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = React.memo(({ isLoading, jobCount }) => (
  <div className="flex items-center justify-between mb-6">
    <p className="text-gray-600">
      {isLoading ? (
        'Loading...'
      ) : (
        <>
          <span className="font-semibold text-gray-900">
            {jobCount}
          </span>{' '}
          jobs found
        </>
      )}
    </p>
  </div>
));

ResultsHeader.displayName = 'ResultsHeader';

interface EmptyStateProps {
  onClearFilters: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ onClearFilters }) => (
  <Card className="p-12 border border-gray-100 shadow-sm rounded-xl">
    <div className="text-center">
      <BriefcaseIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No jobs found
      </h3>
      <p className="text-gray-600 mb-6">
        Try adjusting your search criteria or filters
      </p>
      <Button
        onClick={onClearFilters}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-sm transition-colors"
      >
        Clear Filters
      </Button>
    </div>
  </Card>
));

EmptyState.displayName = 'EmptyState';

// ============================================================================
// Main Component
// ============================================================================

/**
 * Jobs page – displays a searchable, filterable list of job postings.
 * Enhanced with modern blue/white design, grid layout, and smooth shadows.
 */
const Jobs: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    minPay,
    setMinPay,
    maxPay,
    setMaxPay,
    activeFiltersCount,
    applyFilters,
    clearFilters,
  } = useJobFilters();

  const { jobs, isLoading, error } = useJobResults();

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleSearch = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center border border-gray-100 shadow-md rounded-xl">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600">
            We couldn't load the job listings. Please try again later.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <main id="jobs-page" className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl opacity-25 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl opacity-25 animate-blob animation-delay-4000" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <style>{grapeNutsStyle}</style>
      {/* Header with search and filters */}
      <div className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Find Your Next Job
          </h1>

          <SearchBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearch={handleSearch}
            onToggleFilters={toggleFilters}
            activeFiltersCount={activeFiltersCount}
            showFilters={showFilters}
          />

          {showFilters && (
            <FilterPanel
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              minPay={minPay}
              onMinPayChange={setMinPay}
              maxPay={maxPay}
              onMaxPayChange={setMaxPay}
              onApply={handleSearch}
              onClear={handleClearFilters}
            />
          )}
        </div>
      </div>

      {/* Results section */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResultsHeader isLoading={isLoading} jobCount={jobs?.length || 0} />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 border border-gray-100 shadow-sm rounded-xl">
                <Skeleton className="h-32" />
              </Card>
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job: Job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState onClearFilters={handleClearFilters} />
        )}
      </div>
    </main>
  );
};

export default Jobs;