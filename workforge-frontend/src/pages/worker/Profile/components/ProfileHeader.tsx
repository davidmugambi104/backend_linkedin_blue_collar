import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Rating } from '@components/common/Rating';
import { formatCurrency } from '@lib/utils/format';
import { Worker } from '@types';

interface ProfileHeaderProps {
  worker: Worker;
  onEdit: () => void;
  isOwnProfile?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  worker,
  onEdit,
  isOwnProfile = true,
}) => {
  return (
    <div className="bg-white bg-gray-900 rounded-lg shadow-sm border border-gray-200 border-gray-800 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar
            src={worker.profile_picture}
            name={worker.full_name}
            size="xl"
            bordered
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 text-[#1A1A1A]">
                {worker.full_name}
              </h1>
              {worker.is_verified && (
                <Badge variant="success" size="sm">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-gray-600  mt-1">
              @{worker.user?.username}
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center">
                <Rating rating={worker.average_rating || 0} total={worker.total_ratings} />
                <span className="ml-2 text-sm text-gray-600 ">
                  ({worker.total_ratings} reviews)
                </span>
              </div>
              <div className="text-sm text-gray-600 ">
                <span className="font-semibold text-gray-900 text-[#1A1A1A]">
                  {formatCurrency(worker.hourly_rate || 0)}
                </span>
                /hr
              </div>
            </div>
          </div>
        </div>
        
        {isOwnProfile && (
          <Button
            onClick={onEdit}
            variant="outline"
            leftIcon={<PencilIcon className="w-4 h-4" />}
            className="mt-4 sm:mt-0"
          >
            Edit Profile
          </Button>
        )}
      </div>

      {worker.bio && (
        <div className="mt-6 pt-6 border-t border-gray-200 border-gray-800">
          <h2 className="text-sm font-medium text-slate-700  mb-2">
            About
          </h2>
          <p className="text-gray-600  whitespace-pre-line">
            {worker.bio}
          </p>
        </div>
      )}
    </div>
  );
};