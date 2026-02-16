import { HTMLAttributes } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  name?: string;
  fallback?: string;
  bordered?: boolean;
  status?: 'online' | 'offline' | 'busy' | 'away';
}