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

const ReviewCard: React.FC<{ review: Review; onRespond?: (id: number) => void }> = ({ review, onRespond }) => {
  const [showRespond, setShowRespond] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
          <button className="icon-btn ml-2">
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
              />
              <div className="flex items-center justify-end gap-2 mt-3">
                <button className="btn-ghost text-sm">Cancel</button>
                <button className="btn-primary text-sm">Post Response</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-charcoal-100">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-sm text-muted hover:text-navy transition-colors">
            <HandThumbUpIcon className="w-4 h-4" />
            <span>Helpful ({review.helpful})</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted hover:text-navy transition-colors">
            <HandThumbDownIcon className="w-4 h-4" />
            <span>Not helpful ({review.notHelpful})</span>
          </button>
        </div>
        <button className="flex items-center gap-1.5 text-sm text-muted hover:text-red-600 transition-colors">
          <FlagIcon className="w-4 h-4" />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
};

// Stats Overview
const ReviewStats: React.FC = () => {
  const stats = [
    { label: 'Average Rating', value: '4.7', icon: <StarSolidIcon className="w-6 h-6" />, suffix: '/5' },
    { label: 'Total Reviews', value: '128', icon: null },
    { label: 'This Month', value: '+24', icon: null, trend: '+12%' },
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

// Mock Data
const mockReviews: Review[] = [
  { 
    id: 1, 
    workerName: 'Ariana Flores', 
    employerName: 'WorkForge Builders',
    date: 'Mar 2, 2026', 
    rating: 5, 
    comment: 'Clear requirements and excellent communication throughout the entire project. The employer was very professional and paid on time. Would definitely work with them again!',
    jobTitle: 'Electrician',
    verified: true,
    helpful: 12,
    notHelpful: 0,
    response: 'Thank you for the kind words, Ariana! It was a pleasure working with you. Looking forward to our next project together.'
  },
  { 
    id: 2, 
    workerName: 'Leo Kim', 
    employerName: 'Austin Construction',
    date: 'Feb 20, 2026', 
    rating: 4, 
    comment: 'Project scope was well organized and timeline was realistic. Slight communication delays but overall a good experience.',
    jobTitle: 'Welder',
    verified: true,
    helpful: 8,
    notHelpful: 1,
  },
  { 
    id: 3, 
    workerName: 'Nina Patel', 
    employerName: 'Texas Renovations',
    date: 'Feb 15, 2026', 
    rating: 3, 
    comment: 'Great team to work with overall. The only issue was that onboarding details could have been clearer at the start, which caused some confusion.',
    jobTitle: 'Project Coordinator',
    verified: false,
    helpful: 5,
    notHelpful: 2,
    response: 'We appreciate the feedback, Nina. We will work on improving our onboarding process for future projects.'
  },
  { 
    id: 4, 
    workerName: 'James Wilson', 
    employerName: 'Premier Services',
    date: 'Feb 10, 2026', 
    rating: 5, 
    comment: 'Outstanding experience! The employer provided all necessary tools and materials, had clear instructions, and was very approachable throughout.',
    jobTitle: 'HVAC Technician',
    verified: true,
    helpful: 15,
    notHelpful: 0,
  },
  { 
    id: 5, 
    workerName: 'Maria Garcia', 
    employerName: 'BuildRight Inc',
    date: 'Feb 5, 2026', 
    rating: 2, 
    comment: 'The job site safety protocols were not clearly communicated. Would have appreciated more transparency about the work environment before starting.',
    jobTitle: 'Carpenter',
    verified: true,
    helpful: 3,
    notHelpful: 7,
  },
];

const Reviews = () => {
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Filter & sort reviews
  const filtered = useMemo(() => {
    let result = [...mockReviews];
    
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
  }, [ratingFilter, sortBy]);

  // Stats
  const counts = useMemo(() => ({
    all: mockReviews.length,
    five: mockReviews.filter(r => r.rating === 5).length,
    four: mockReviews.filter(r => r.rating === 4).length,
    three: mockReviews.filter(r => r.rating === 3).length,
  }), []);

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
      <ReviewStats />

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
          <ReviewCard key={review.id} review={review} />
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
