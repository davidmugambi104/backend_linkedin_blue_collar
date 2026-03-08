import { cn } from '@utils/cn';

export interface FilterChip {
  value: string;
  label: string;
}

export interface FilterChipsProps {
  chips: FilterChip[];
  active: string;
  onChange: (value: string) => void;
}

export const FilterChips = ({ chips, active, onChange }: FilterChipsProps) => (
  <div className="flex flex-wrap gap-2">
    {chips.map((chip) => {
      const isActive = chip.value === active;
      return (
        <button
          key={chip.value}
          type="button"
          onClick={() => onChange(chip.value)}
          className={cn(
            'inline-flex h-9 items-center rounded-full border px-3 text-sm leading-5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2',
            isActive
              ? 'border-primary-blue bg-primary-blue text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
          )}
        >
          {chip.label}
        </button>
      );
    })}
  </div>
);
