import React from 'react';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { useReviews, useWorkerReviewStats } from '@hooks/useReviews';
import { ReviewCard } from './components/ReviewCard';
import { RatingDistribution } from './components/RatingDistribution';
import { ReviewStats } from '@types';

export default function ReviewList() {
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews();
  const reviews = reviewsData?.reviews || [];
  
  // Get stats if available
  const statsQuery = useWorkerReviewStats(reviews[0]?.worker_id || 0);
  
  const defaultStats: ReviewStats = {
    worker_id: 0,
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recommendation_rate: 0,
    response_rate: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reviews</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">View all reviews and ratings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Recent Reviews</h2>
            </CardHeader>
            <CardBody>
              {reviewsLoading ? (
                <Skeleton className="h-96" />
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No reviews yet</p>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Rating Distribution</h2>
          </CardHeader>
          <CardBody>
            {statsQuery.isLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <RatingDistribution stats={statsQuery.data || defaultStats} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
