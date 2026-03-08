import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';

interface Review {
  id: number;
  workerName: string;
  rating: number;
  comment: string;
  jobTitle: string;
  createdAt: string;
}

const Reviews: React.FC = () => {
  const [reviews] = useState<Review[]>([
    {
      id: 1,
      workerName: 'John Smith',
      rating: 5,
      comment: 'Excellent work! Very professional and completed the job on time. Would hire again.',
      jobTitle: 'Plumbing Repair',
      createdAt: '2 weeks ago',
    },
    {
      id: 2,
      workerName: 'Sarah Johnson',
      rating: 4,
      comment: 'Good quality work. Very responsive and cooperative.',
      jobTitle: 'Electrical Installation',
      createdAt: '1 month ago',
    },
    {
      id: 3,
      workerName: 'Mike Davis',
      rating: 5,
      comment: 'Best contractor I\'ve worked with. Attention to detail and punctual.',
      jobTitle: 'HVAC Maintenance',
      createdAt: '1.5 months ago',
    },
  ]);

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const totalReviews = reviews.length;

  const renderStars = (rating: number) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map(star => (
        star <= rating ? (
          <StarIcon key={star} className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarOutlineIcon key={star} className="h-4 w-4 text-[#E2E8F0]" />
        )
      ))}
    </div>
  );

  return (
    <div className="space-y-6 employer-page-m3">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Reviews & Ratings</h1>
        <p className="mt-2 text-[#64748B]">See what workers say about your services</p>
      </div>

      {/* Rating Summary */}
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-8 employer-m3-card">
        <div className="flex items-center space-x-8">
          <div>
            <p className="text-6xl font-bold text-[#0F172A]">{averageRating}</p>
            <div className="mt-2 flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(star => (
                star <= Math.round(parseFloat(averageRating)) ? (
                  <StarIcon key={star} className="h-5 w-5 text-yellow-400" />
                ) : (
                  <StarOutlineIcon key={star} className="h-5 w-5 text-[#E2E8F0]" />
                )
              ))}
            </div>
            <p className="mt-2 text-sm text-[#64748B]">Based on {totalReviews} reviews</p>
          </div>
          <div className="flex-1 space-y-3">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(r => r.rating === stars).length;
              const percentage = (count / totalReviews) * 100;
              return (
                <div key={stars} className="flex items-center space-x-3">
                  <span className="text-sm text-[#64748B] w-12">{stars} stars</span>
                  <div className="h-2 flex-1 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{width: `${percentage}%`}}
                    />
                  </div>
                  <span className="text-sm text-[#64748B] w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0F172A]">Recent Reviews</h2>
        {reviews.map(review => (
          <Card key={review.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-md transition employer-m3-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-[#0F172A]">{review.workerName}</h3>
                <p className="text-sm text-[#64748B]">{review.jobTitle}</p>
              </div>
              <Badge variant="default" className="text-xs">{review.createdAt}</Badge>
            </div>
            <div className="mb-3">{renderStars(review.rating)}</div>
            <p className="text-[#64748B]">{review.comment}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
