import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { ReviewStats } from '@types';

interface RatingDistributionProps {
  stats: ReviewStats;
}

export const RatingDistribution: React.FC<RatingDistributionProps> = ({ stats }) => {
  const total = stats.total_reviews;

  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return (count / total) * 100;
  };

  const ratings = [
    { value: 5, count: stats.rating_distribution[5] },
    { value: 4, count: stats.rating_distribution[4] },
    { value: 3, count: stats.rating_distribution[3] },
    { value: 2, count: stats.rating_distribution[2] },
    { value: 1, count: stats.rating_distribution[1] },
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 text-[#1A1A1A]">
          Rating Distribution
        </h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 text-[#1A1A1A]">
              {stats.average_rating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(stats.average_rating)
                      ? 'text-yellow-400'
                      : 'text-slate-300 text-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600 ">
              Based on {stats.total_reviews} reviews
            </p>
          </div>

          {/* Distribution Bars */}
          <div className="space-y-2 mt-6">
            {ratings.map((rating) => (
              <div key={rating.value} className="flex items-center space-x-3">
                <div className="flex items-center w-12">
                  <span className="text-sm font-medium text-slate-700 ">
                    {rating.value} ★
                  </span>
                </div>
                <div className="flex-1 h-2 bg-gray-200 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${getPercentage(rating.count)}%` }}
                  />
                </div>
                <div className="w-12 text-right">
                  <span className="text-sm text-gray-600 ">
                    {rating.count}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendation Rate */}
          {stats.recommendation_rate > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 border-gray-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 text-green-400">
                  {stats.recommendation_rate}%
                </div>
                <p className="text-sm text-gray-600  mt-1">
                  would recommend this worker
                </p>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};