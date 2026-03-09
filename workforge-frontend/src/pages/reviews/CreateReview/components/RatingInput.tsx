import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  error?: string;
  label?: string;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  size = 'md',
  disabled = false,
  error,
  label,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const ratings = [
    { value: 1, label: 'Poor', description: 'Terrible experience' },
    { value: 2, label: 'Fair', description: 'Below expectations' },
    { value: 3, label: 'Good', description: 'Met expectations' },
    { value: 4, label: 'Very Good', description: 'Exceeded expectations' },
    { value: 5, label: 'Excellent', description: 'Outstanding experience' },
  ];

  const currentHover = hoverValue || value;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700 ">
          {label} <span className="text-red-500">*</span>
        </label>
      )}

      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-1">
          {ratings.map((rating) => (
            <button
              key={rating.value}
              type="button"
              className={cn(
                'focus:outline-none transition-transform',
                disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'
              )}
              onMouseEnter={() => !disabled && setHoverValue(rating.value)}
              onMouseLeave={() => !disabled && setHoverValue(null)}
              onClick={() => !disabled && onChange(rating.value)}
              disabled={disabled}
            >
              {rating.value <= currentHover ? (
                <StarIcon
                  className={cn(
                    sizes[size],
                    'text-yellow-400 transition-colors'
                  )}
                />
              ) : (
                <StarOutlineIcon
                  className={cn(
                    sizes[size],
                    'text-slate-300 text-gray-600 transition-colors'
                  )}
                />
              )}
            </button>
          ))}
        </div>

        {currentHover > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 text-[#1A1A1A]">
              {ratings[currentHover - 1].label}
            </span>
            <span className="text-xs text-slate-500 ">
              {ratings[currentHover - 1].description}
            </span>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
};