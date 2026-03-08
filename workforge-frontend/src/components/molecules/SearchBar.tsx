import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Button, InputField } from '@components/atoms';
import { cn } from '@utils/cn';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showFilterToggle?: boolean;
  onFilterToggle?: () => void;
  className?: string;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search…',
  showFilterToggle = false,
  onFilterToggle,
  className,
}: SearchBarProps) => {
  return (
    <div className={cn('flex min-h-11 items-center rounded-lg border border-gray-300 bg-white pl-3 pr-1', className)}>
      <InputField
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 border-none px-2 py-0 focus:ring-0"
      />
      <Button variant="icon" aria-label="Search">
        <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
      </Button>
      {showFilterToggle ? (
        <Button variant="icon" aria-label="Toggle filters" onClick={onFilterToggle}>
          <FunnelIcon className="h-5 w-5" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
};
