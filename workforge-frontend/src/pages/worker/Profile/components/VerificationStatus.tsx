import React from 'react';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { 
  ShieldCheckIcon, 
  IdentificationIcon,
  DocumentCheckIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { useWorkerProfile } from '@hooks/useWorker';

interface VerificationStatusProps {
  isOwnProfile?: boolean;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  isOwnProfile = true,
}) => {
  const { data: worker } = useWorkerProfile();

  const verificationItems = [
    {
      id: 'identity',
      label: 'Identity Verification',
      status: worker?.verification_score >= 25 ? 'verified' : 'pending',
      icon: IdentificationIcon,
    },
    {
      id: 'skills',
      label: 'Skills Assessment',
      status: worker?.verification_score >= 50 ? 'verified' : 'pending',
      icon: DocumentCheckIcon,
    },
    {
      id: 'background',
      label: 'Background Check',
      status: worker?.verification_score >= 75 ? 'verified' : 'pending',
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Verification Status</h3>
        {worker?.is_verified && (
          <Badge variant="success" size="sm">
            Fully Verified
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Verification Score */}
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {worker?.verification_score || 0}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Verification Score
            </p>
          </div>

          {/* Verification Steps */}
          <div className="space-y-3">
            {verificationItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <item.icon className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                </div>
                {item.status === 'verified' ? (
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                ) : (
                  <div className="flex items-center text-yellow-600 dark:text-yellow-500">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <span className="text-xs">Pending</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {isOwnProfile && !worker?.is_verified && (
            <Button variant="outline" fullWidth className="mt-4">
              Start Verification
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};