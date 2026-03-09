import { useState, useMemo } from 'react';
import { 
  StarIcon,
  StarIcon as StarSolidIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  EllipsisHorizontalIcon,
  FlagIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEmployerProfile } from '@hooks/useEmployer';
import { reviewService } from '@services/review.service';
import { toast } from 'react-toastify';

// Filter Chip
interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-navy text-white shadow-md' 
        : 'bg-white text-muted border border-charcoal-200 hover:border-navy hover:text-navy'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-charcoal-100'}`}>
        {count}
      </span>
    )}
  </button>
);

// Rating Stars
const RatingStars: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= rating ? (
          <StarSolid key={star} className={`${sizeClasses} text-amber-400 fill-amber-400`} />
        ) : (
          <StarIcon key={star} className={`${sizeClasses} text-charcoal-300`} />
        )
      ))}
    </div>
  );
};

// Review Card
interface Review {
  id: number;
  workerName: string;
  workerAvatar?: string;
  employerName: string;
  date: string;
  rating: number;
  comment: string;
  response?: string;
  jobTitle: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
}

const ReviewCard: React.FC<{
  review: Review;
  onRespond: (reviewId: number, content: string) => Promise<void>;
  onHelpful: (reviewId: number) => Promise<void>;
  onNotHelpful: (reviewId: number) => Promise<void>;
  onReport: (reviewId: number) => Promise<void>;
}> = ({ review, onRespond, onHelpful, onNotHelpful, onReport }) => {
  const [showRespond, setShowRespond] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [responseText, setResponseText] = useState('');

  return (
    <div className="solid-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy font-semibold">
            {review.workerName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-charcoal">{review.workerName}</h4>
              {review.verified && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted">{review.jobTitle} • {review.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RatingStars rating={review.rating} />
          <button type="button" onClick={() => onReport(review.id)} className="icon-btn ml-2">
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className={`text-charcoal ${!expanded && review.comment.length > 200 ? 'line-clamp-2' : ''}`}>
        {review.comment}
      </p>
      {review.comment.length > 200 && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-navy mt-2 hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Employer Response */}
      {review.response ? (
        <div className="mt-4 p-4 bg-charcoal-50 rounded-lg border-l-4 border-navy">
          <p className="text-xs font-medium text-muted mb-2">Employer Response</p>
          <p className="text-sm text-charcoal">{review.response}</p>
        </div>
      ) : (
        <div className="mt-4">
          <button 
            onClick={() => setShowRespond(!showRespond)}
            className="text-sm font-medium text-navy hover:underline"
          >
            {showRespond ? 'Cancel' : 'Respond to review'}
          </button>
          
          {showRespond && (
            <div className="mt-3 animate-fade-in-up">
              <textarea
                placeholder="Write your response..."
                className="input-field min-h-[100px] resize-none"
                rows={3}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  onClick={() => {
                    setShowRespond(false);
                    setResponseText('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm"
                  onClick={async () => {
                    if (!responseText.trim()) {
                      toast.info('Please enter a response before posting.');
                      return;
                    }

                    await onRespond(review.id, responseText.trim());
                    setShowRespond(false);
                    setResponseText('');
                  }}
                >
                  Post Response
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-charcoal-100">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onHelpful(review.id)}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-navy transition-colors"
          >
            <HandThumbUpIcon className="w-4 h-4" />
            <span>Helpful ({review.helpful})</span>
          </button>
          <button
            type="button"
            onClick={() => onNotHelpful(review.id)}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-navy transition-colors"
          >
            <HandThumbDownIcon className="w-4 h-4" />
            <span>Not helpful ({review.notHelpful})</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => onReport(review.id)}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-red-600 transition-colors"
        >
          <FlagIcon className="w-4 h-4" />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
};

// Stats Overview
const ReviewStats: React.FC<{ reviews: Review[] }> = ({ reviews }) => {
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const stats = [
    { label: 'Average Rating', value: averageRating, icon: <StarSolidIcon className="w-6 h-6" />, suffix: '/5' },
    { label: 'Total Reviews', value: String(reviews.length), icon: null },
    { label: 'This Month', value: String(reviews.filter((review) => new Date(review.date).getMonth() === new Date().getMonth()).length), icon: null, trend: '+12%' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-widget">
          <div className="flex items-center justify-between mb-3">
            {stat.icon && (
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                {stat.icon}
              </div>
            )}
            {stat.trend && (
              <span className="text-sm font-medium text-emerald-600">+12%</span>
            )}
          </div>
          <p className="text-2xl font-bold text-charcoal flex items-baseline gap-1">
            {stat.value}
            {stat.suffix && <span className="text-lg text-muted font-normal">{stat.suffix}</span>}
          </p>
          <p className="text-sm text-muted mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

const Reviews = () => {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const { data: profile } = useEmployerProfile();
  const { data: reviewsResponse } = useQuery({
    queryKey: ['employerReviews', profile?.id],
    enabled: !!profile?.id,
    queryFn: () => reviewService.getReviews({ employer_id: profile!.id }),
  });

  const refreshReviews = () => {
    queryClient.invalidateQueries({ queryKey: ['employerReviews', profile?.id] });
  };

  const addResponseMutation = useMutation({
    mutationFn: ({ reviewId, content }: { reviewId: number; content: string }) => reviewService.addResponse(reviewId, content),
    onSuccess: () => {
      refreshReviews();
      toast.success('Response posted successfully');
    },
    onError: () => {
      toast.error('Failed to post response');
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: (reviewId: number) => reviewService.markHelpful(reviewId),
    onSuccess: () => {
      refreshReviews();
      toast.success('Marked as helpful');
    },
    onError: () => {
      toast.error('Failed to update helpful vote');
    },
  });

  const notHelpfulMutation = useMutation({
    mutationFn: (reviewId: number) => reviewService.unmarkHelpful(reviewId),
    onSuccess: () => {
      refreshReviews();
      toast.success('Removed helpful vote');
    },
    onError: () => {
      toast.error('Failed to update not helpful vote');
    },
  });

  const reportMutation = useMutation({
    mutationFn: (reviewId: number) => reviewService.reportReview(reviewId, 'Inappropriate or inaccurate content'),
    onSuccess: () => {
      toast.success('Review reported');
    },
    onError: () => {
      toast.error('Failed to report review');
    },
  });

  const reviews = useMemo<Review[]>(() => {
    const list = reviewsResponse?.reviews || [];
    return list.map((review) => ({
      id: review.id,
      workerName: review.worker?.full_name || `Worker #${review.worker_id}`,
      employerName: review.employer?.company_name || profile?.company_name || 'Employer',
      date: review.created_at ? new Date(review.created_at).toLocaleDateString() : '—',
      rating: review.rating,
      comment: review.comment || review.pros || 'No comment provided',
      response: review.responses?.[0]?.content,
      jobTitle: review.job?.title || `Job #${review.job_id}`,
      verified: Boolean(review.worker?.is_verified),
      helpful: review.helpful_count || 0,
      notHelpful: review.reported_count || 0,
    }));
  }, [reviewsResponse, profile]);

  // Filter & sort reviews
  const filtered = useMemo(() => {
    let result = [...reviews];
    
    if (ratingFilter !== 'all') {
      result = result.filter(r => r.rating === Number(ratingFilter));
    }
    
    if (sortBy === 'recent') {
      // Already sorted by date
    } else if (sortBy === 'oldest') {
      result.reverse();
    } else if (sortBy === 'highest') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.rating - b.rating);
    }
    
    return result;
  }, [ratingFilter, reviews, sortBy]);

  // Stats
  const counts = useMemo(() => ({
    all: reviews.length,
    five: reviews.filter(r => r.rating === 5).length,
    four: reviews.filter(r => r.rating === 4).length,
    three: reviews.filter(r => r.rating === 3).length,
  }), [reviews]);

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="page-subtitle">Manage worker feedback and respond to reviews</p>
        </div>
      </div>

      {/* Stats */}
      <ReviewStats reviews={reviews} />

      {/* Filters */}
      <div className="solid-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip 
              label="All" 
              active={ratingFilter === 'all'} 
              onClick={() => setRatingFilter('all')}
              count={counts.all}
            />
            <FilterChip 
              label="5 stars" 
              active={ratingFilter === '5'} 
              onClick={() => setRatingFilter('5')}
              count={counts.five}
            />
            <FilterChip 
              label="4 stars" 
              active={ratingFilter === '4'} 
              onClick={() => setRatingFilter('4')}
              count={counts.four}
            />
            <FilterChip 
              label="3 stars" 
              active={ratingFilter === '3'} 
              onClick={() => setRatingFilter('3')}
              count={counts.three}
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-auto"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filtered.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onRespond={async (reviewId, content) => {
              await addResponseMutation.mutateAsync({ reviewId, content });
            }}
            onHelpful={(reviewId) => helpfulMutation.mutateAsync(reviewId)}
            onNotHelpful={(reviewId) => notHelpfulMutation.mutateAsync(reviewId)}
            onReport={async (reviewId) => {
              await reportMutation.mutateAsync(reviewId);
            }}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="w-16 h-16 rounded-full bg-charcoal-100 flex items-center justify-center mx-auto mb-4">
            <StarIcon className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">No reviews found</h3>
          <p className="text-muted">No reviews match your current filter.</p>
        </div>
      )}
    </div>
  );
};

export default Reviews;
