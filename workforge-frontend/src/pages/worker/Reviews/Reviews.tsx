import React from 'react';
import { StarIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useWorkerReviews } from '@hooks/useWorker';
import { formatDate } from '@lib/utils/format';

export const WorkerReviews: React.FC = () => {
  const { data: reviews, isLoading, error } = useWorkerReviews();

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews?.forEach((review: any) => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load reviews</p>
      </div>
    );
  }

  const avgRating = calculateAverageRating();
  const distribution = getRatingDistribution();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-2 text-gray-600">See what employers say about you</p>
      </div>

      {/* Rating Summary */}
      {reviews && reviews.length > 0 && (
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-600 mb-2">Average Rating</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-gray-900">{avgRating}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(Number(avgRating))
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{reviews.length} reviews</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-4">Rating Breakdown</p>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium w-8">{rating}★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{
                        width: `${reviews.length > 0 ? (distribution[rating as keyof typeof distribution] / reviews.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {distribution[rating as keyof typeof distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <Card key={review.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {review.reviewer?.first_name} {review.reviewer?.last_name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <CalendarIcon className="w-4 h-4" />
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <Badge className="mt-2" variant="outline">
                    {review.rating}/5
                  </Badge>
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <StarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h2>
          <p className="text-gray-600">
            Complete jobs to earn reviews from employers and build your reputation.
          </p>
        </Card>
      )}
    </div>
  );
};

export default WorkerReviews;
