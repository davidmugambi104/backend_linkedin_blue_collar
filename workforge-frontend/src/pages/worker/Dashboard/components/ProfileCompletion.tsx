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
    <Card className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft hover:shadow-lg transition-all duration-300">
      <CardHeader className="border-b border-blue-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Profile Completion</h3>
          {isComplete ? (
            <div className="p-2 bg-success-500/10 rounded-full border border-success-500/20">
              <CheckCircleIcon className="w-5 h-5 text-success-600" />
            </div>
          ) : (
            <div className="p-2 bg-warning-500/10 rounded-full border border-warning-500/20">
              <ExclamationCircleIcon className="w-5 h-5 text-warning-600" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody className="pt-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 text-slate-300">
                {completion}% Complete
              </span>
              <span className={`text-sm font-medium ${isComplete ? 'text-success-600' : 'text-warning-600'}`}>
                {isComplete ? 'Ready to apply!' : 'Needs attention'}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 bg-slate-700 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${isComplete ? 'bg-success-500' : 'bg-primary-500'}`}
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {!isComplete && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 text-slate-300">
                Complete your profile to get more job opportunities:
              </p>
              <ul className="space-y-1">
                {missingItems.slice(0, 3).map((item, index) => (
                  <li key={index} className="text-sm text-slate-600 text-slate-400 flex items-start">
                    <span className="text-warning-500 mr-2">•</span>
                    {item}
                  </li>
                ))}
                {missingItems.length > 3 && (
                  <li className="text-sm text-slate-500 text-slate-500">
                    +{missingItems.length - 3} more items
                  </li>
                )}
              </ul>
            </div>
          )}

          <Link to="/worker/profile">
            <Button
              variant="outline"
              fullWidth
              className={`border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 ${isComplete ? '' : 'border-warning-200 text-warning-700 hover:bg-warning-50 hover:border-warning-300'}`}
            >
              {isComplete ? 'Update Profile' : 'Complete Profile'}
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
};