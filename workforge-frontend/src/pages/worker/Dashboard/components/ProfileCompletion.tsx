import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useWorkerProfile } from '@hooks/useWorker';
import { useWorkerSkills } from '@hooks/useWorkerSkills';

export const ProfileCompletion: React.FC = () => {
  const { data: profile } = useWorkerProfile();
  const { data: skills } = useWorkerSkills();

  const calculateCompletion = () => {
    let score = 0;
    let total = 0;

    // Basic info (40%)
    if (profile?.full_name) score += 10;
    if (profile?.bio) score += 10;
    if (profile?.phone) score += 10;
    if (profile?.hourly_rate) score += 10;
    total += 40;

    // Location (20%)
    if (profile?.address) score += 10;
    if (profile?.location_lat && profile?.location_lng) score += 10;
    total += 20;

    // Skills (30%)
    const skillScore = Math.min((skills?.length || 0) * 6, 30);
    score += skillScore;
    total += 30;

    // Profile picture (10%)
    if (profile?.profile_picture) score += 10;
    total += 10;

    return Math.round((score / total) * 100);
  };

  const completion = calculateCompletion();
  const isComplete = completion >= 80;

  const missingItems = [
    !profile?.full_name && 'Add your full name',
    !profile?.bio && 'Write a bio',
    !profile?.phone && 'Add phone number',
    !profile?.hourly_rate && 'Set your hourly rate',
    !profile?.address && 'Add your location',
    (!skills || skills.length === 0) && 'Add at least one skill',
    !profile?.profile_picture && 'Upload a profile picture',
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Profile Completion</h3>
        {isComplete ? (
          <CheckCircleIcon className="w-6 h-6 text-green-500" />
        ) : (
          <ExclamationCircleIcon className="w-6 h-6 text-yellow-500" />
        )}
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {completion}% Complete
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isComplete ? 'Ready to apply!' : 'Needs attention'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {!isComplete && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Complete your profile to get more job opportunities:
              </p>
              <ul className="space-y-1">
                {missingItems.slice(0, 3).map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {item}
                  </li>
                ))}
                {missingItems.length > 3 && (
                  <li className="text-sm text-gray-500 dark:text-gray-500">
                    +{missingItems.length - 3} more items
                  </li>
                )}
              </ul>
            </div>
          )}

          <Link to="/worker/profile">
            <Button variant="outline" fullWidth>
              {isComplete ? 'Update Profile' : 'Complete Profile'}
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
};