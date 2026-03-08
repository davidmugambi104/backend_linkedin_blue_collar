import type { ImgHTMLAttributes } from 'react';
import { cn } from '@utils/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  name: string;
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-yellow-100 text-yellow-800'];

const colorFromName = (name: string) => {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export const Avatar = ({ name, size = 'md', src, alt, className, ...props }: AvatarProps) => {
  if (src) {
    return <img src={src} alt={alt ?? `${name} avatar`} className={cn('rounded-full object-cover', sizeClasses[size], className)} {...props} />;
  }

  return (
    <div className={cn('inline-flex items-center justify-center rounded-full font-medium', sizeClasses[size], colorFromName(name), className)} aria-label={name}>
      {getInitials(name)}
    </div>
  );
};
