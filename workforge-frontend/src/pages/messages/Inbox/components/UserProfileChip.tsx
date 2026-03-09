import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@components/ui/Avatar';
import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';

interface ChatUserSummary {
  id: number;
  username: string;
  role: string;
  profile?: {
    full_name?: string;
    company_name?: string;
    profile_picture?: string;
    logo?: string;
  } | null;
}

interface JobContextResponse {
  profile_url?: string;
  job_context?: {
    id: number;
    title: string;
    match_percentage: number;
  } | null;
}

interface UserProfileChipProps {
  user: ChatUserSummary;
}

const getDefaultProfileUrl = (user: ChatUserSummary): string => {
  switch (user.role) {
    case 'worker':
      return '/workers';
    case 'employer':
      return '/jobs';
    case 'admin':
      return `/admin/users/${user.id}`;
    default:
      return '/messages';
  }
};

export const UserProfileChip: React.FC<UserProfileChipProps> = ({ user }) => {
  const [jobContext, setJobContext] = useState<JobContextResponse['job_context']>(null);
  const [profileUrl, setProfileUrl] = useState<string>(() => getDefaultProfileUrl(user));

  useEffect(() => {
    let isMounted = true;

    const loadContext = async () => {
      try {
        const response = await axiosClient.get<JobContextResponse>(ENDPOINTS.JOBS.CONTEXT(user.id));
        if (!isMounted) {
          return;
        }

        if (response.profile_url) {
          setProfileUrl(response.profile_url);
        }

        setJobContext(response.job_context || null);
      } catch {
        if (isMounted) {
          setJobContext(null);
        }
      }
    };

    loadContext();

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  const displayName = useMemo(() => {
    if (user.role === 'worker') {
      return user.profile?.full_name || user.username;
    }

    if (user.role === 'employer') {
      return user.profile?.company_name || user.username;
    }

    return user.username;
  }, [user]);

  const avatarSrc = user.role === 'worker'
    ? user.profile?.profile_picture
    : user.profile?.logo;

  const roleBadgeClasses: Record<string, string> = {
    worker: 'bg-navy-100 text-navy-700',
    employer: 'bg-emerald-100 text-emerald-700',
    admin: 'bg-purple-100 text-purple-700',
  };

  return (
    <Link
      to={profileUrl}
      className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-navy-50 transition-colors"
      title="Open user profile"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Avatar
        src={avatarSrc}
        name={displayName}
        size="md"
      />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-charcoal truncate">
            {displayName}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeClasses[user.role] || 'bg-charcoal-100 text-charcoal-600'}`}>
            {user.role}
          </span>
        </div>

        {jobContext && (
          <p className="text-xs text-muted truncate">
            Discussing: {jobContext.title}
            <span className="ml-2 font-semibold text-navy">{jobContext.match_percentage}% match</span>
          </p>
        )}
      </div>
    </Link>
  );
};
