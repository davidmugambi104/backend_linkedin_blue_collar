import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { useDebounce } from '@hooks/useDebounce';

interface JobSearchHeaderProps {
  onSearch: (query: string) => void;
  onToggleFilters: () => void;
  showFilters: boolean;
}

export const JobSearchHeader: React.FC<JobSearchHeaderProps> = ({
  onSearch,
  onToggleFilters,
  showFilters,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  React.useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <div className="bg-white bg-gray-900 rounded-lg shadow-sm border border-gray-200 border-gray-800 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search jobs by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            fullWidth
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={onToggleFilters}
          leftIcon={<FunnelIcon className="h-5 w-5" />}
          className="sm:w-auto"
        >
          Filters
        </Button>
      </div>
    </div>
  );
};