import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  IdentificationIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { DocumentViewer } from './DocumentViewer';
import { VerificationActions } from './VerificationActions';
import type { VerificationRequest } from '@types';
import { formatCurrency } from '@lib/utils/format';
import { cn } from '@lib/utils/cn';

interface VerificationRequestCardProps {
  request: VerificationRequest;
  onReview: (verificationId: number, status: 'approved' | 'rejected', notes?: string) => void;
}

export const VerificationRequestCard: React.FC<VerificationRequestCardProps> = ({
  request,
  onReview,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDocument, setShowDocument] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'id_card':
        return IdentificationIcon;
      case 'license':
        return DocumentCheckIcon;
      case 'certification':
        return ShieldCheckIcon;
      default:
        return IdentificationIcon;
    }
  };

  const Icon = getTypeIcon(request.type);
  const documentUrl = request.document_urls?.[0];

  return (
    <>
      <Card className={cn('transition-all', isExpanded && 'ring-2 ring-primary-500')}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar
                src={request.worker?.profile_picture}
                name={request.worker?.full_name}
                size="lg"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {request.worker?.full_name}
                  </h4>
                  <Badge
                    variant={
                      request.status === 'pending'
                        ? 'warning'
                        : request.status === 'verified'
                        ? 'success'
                        : 'error'
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Icon className="w-4 h-4 mr-1" />
                    <span className="capitalize">
                      {request.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <span>Submitted {format(new Date(request.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show Less' : 'Review Document'}
            </Button>
          </div>

          {/* Worker Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {request.worker?.email}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {request.worker?.phone || 'Not provided'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Score</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {request.worker?.verification_score}%
              </p>
            </div>
          </div>

          {/* Document Preview */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Document: {documentUrl ? documentUrl.split('/').pop() : 'N/A'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDocument(true)}
                  >
                    View Full Document
                  </Button>
                </div>
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <DocumentCheckIcon className="w-12 h-12 text-gray-400" />
                </div>
              </div>

              {/* Review Actions */}
              {request.status === 'pending' && (
                <VerificationActions
                  verificationId={request.id}
                  onApprove={(notes) => onReview(request.id, 'approved', notes)}
                  onReject={(notes) => onReview(request.id, 'rejected', notes)}
                />
              )}

              {/* Review Notes */}
              {request.review_notes && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Review Notes:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {request.review_notes}
                  </p>
                  {request.reviewed_by && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Reviewed by Admin #{request.reviewed_by} •{' '}
                      {format(new Date(request.updated_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={showDocument}
        onClose={() => setShowDocument(false)}
        documentUrl={documentUrl}
        documentType={request.type}
      />
    </>
  );
};