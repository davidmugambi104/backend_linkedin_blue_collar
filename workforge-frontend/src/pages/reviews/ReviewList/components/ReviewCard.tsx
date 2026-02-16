import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  StarIcon,
  HandThumbUpIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Review } from '@types';
import { useAuth } from '@context/AuthContext';
import { useMarkHelpful } from '@hooks/useReviews';
import { cn } from '@lib/utils/cn';

interface ReviewCardProps {
  review: Review;
  onResponse?: (reviewId: number) => void;
  onReport?: (reviewId: number) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onResponse,
  onReport,
}) => {
  const { user } = useAuth();
  const [isHelpful, setIsHelpful] = useState(false);
  const markHelpful = useMarkHelpful();

  const handleMarkHelpful = async () => {
    try {
      await markHelpful.mutateAsync(review.id);
      setIsHelpful(!isHelpful);
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const isEmployer = user?.id === review.employer?.user_id;
  const isAnonymous = review.is_anonymous && !isEmployer;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {!isAnonymous ? (
              <Avatar
                src={review.employer?.logo}
                name={review.employer?.company_name}
                size="lg"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  A
                </span>
              </div>
            )}
            
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {isAnonymous ? 'Anonymous' : review.employer?.company_name}
                </h4>
                {isEmployer && (
                  <Badge variant="info" size="sm">
                    You
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center mt-1 space-x-3">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(review.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {review.would_recommend && (
            <Badge variant="success" size="sm">
              Recommended
            </Badge>
          )}
        </div>

        {/* Review Content */}
        <div className="mt-4">
          {review.title && (
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {review.title}
            </h5>
          )}
          
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {review.comment}
          </p>

          {/* Pros & Cons */}
          {(review.pros || review.cons) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {review.pros && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-green-800 dark:text-green-400 mb-1">
                    Pros
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {review.pros}
                  </p>
                </div>
              )}
              {review.cons && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-800 dark:text-red-400 mb-1">
                    Cons
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {review.cons}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Employer Response */}
        {review.responses && review.responses.length > 0 && (
          <div className="mt-4 pl-6 border-l-4 border-primary-200 dark:border-primary-800">
            {review.responses.map((response) => (
              <div key={response.id} className="text-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {response.user?.role === 'employer' 
                      ? review.employer?.company_name 
                      : review.worker?.full_name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(response.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {response.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleMarkHelpful}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
            >
              {isHelpful ? (
                <HandThumbUpSolidIcon className="w-4 h-4 text-primary-600" />
              ) : (
                <HandThumbUpIcon className="w-4 h-4" />
              )}
              <span>Helpful ({review.helpful_count + (isHelpful ? 1 : 0)})</span>
            </button>

            {isEmployer && !review.responses?.length && (
              <button
                onClick={() => onResponse?.(review.id)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>Respond</span>
              </button>
            )}

            {!isEmployer && (
              <button
                onClick={() => onReport?.(review.id)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                <FlagIcon className="w-4 h-4" />
                <span>Report</span>
              </button>
            )}
          </div>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            Job: {review.job?.title}
          </span>
        </div>
      </div>
    </Card>
  );
};