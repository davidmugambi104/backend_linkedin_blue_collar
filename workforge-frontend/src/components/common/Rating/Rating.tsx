import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  max?: number;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
  max = 5,
  className,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleMouseEnter = (index: number) => {
    if (readonly || !onChange) return;
    setHoverValue(index);
  };

  const handleMouseLeave = () => {
    if (readonly || !onChange) return;
    setHoverValue(null);
  };

  const handleClick = (index: number) => {
    if (readonly || !onChange) return;
    onChange(index);
  };

  const displayValue = hoverValue ?? value;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((index) => (
        <button
          key={index}
          type="button"
          className={cn(
            'focus:outline-none',
            readonly ? 'cursor-default' : 'cursor-pointer'
          )}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(index)}
          disabled={readonly}
        >
          {index <= displayValue ? (
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
                'text-gray-300 bg-text-gray-600 transition-colors'
              )}
            />
          )}
        </button>
      ))}
      
      {!readonly && (
        <span className="ml-2 text-sm text-gray-600 bg-text-gray-400">
          {value.toFixed(1)} / {max}
        </span>
      )}
    </div>
  );
};