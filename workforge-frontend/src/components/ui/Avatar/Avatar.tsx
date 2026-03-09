import React, { forwardRef, useState } from 'react';
import { cn } from '@lib/utils/cn';
import { AvatarProps } from './Avatar.types';

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getRandomColor = (name: string): string => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'Avatar',
      size = 'md',
      name,
      fallback,
      bordered = false,
      status,
      className,
      ...props
    },
    ref
  ) => {
    const [error, setError] = useState(false);
    
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
    };

    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    };

    const statusColors = {
      online: 'bg-emerald-500',
      offline: 'bg-slate-400',
      busy: 'bg-red-500',
      away: 'bg-amber-500',
    };

    const initials = name ? getInitials(name) : fallback || '?';
    const bgColor = name ? getRandomColor(name) : 'bg-gray-400';

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex shrink-0', className)}
        {...props}
      >
        {src && !error ? (
          <img
            src={src}
            alt={alt}
            className={cn(
              'rounded-full object-cover',
              sizes[size],
              bordered && 'ring-2 ring-white bg-ring-slate-900'
            )}
            onError={() => setError(true)}
          />
        ) : (
          <div
            className={cn(
              'flex items-center justify-center rounded-full font-medium text-white',
              sizes[size],
              bgColor,
              bordered && 'ring-2 ring-white bg-ring-slate-900'
            )}
          >
            {initials}
          </div>
        )}
        
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 block rounded-full ring-2 ring-white bg-ring-slate-900',
              statusSizes[size],
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';