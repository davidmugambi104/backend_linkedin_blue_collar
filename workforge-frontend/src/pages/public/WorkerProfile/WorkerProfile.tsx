import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import { workerService } from '@services/worker.service';
import { Skeleton } from '@components/ui/Skeleton';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';

const WorkerProfile: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const numericWorkerId = Number(workerId);

  const { data: worker, isLoading, error } = useQuery({
    queryKey: ['worker', numericWorkerId],
    queryFn: () => workerService.getWorkerById(numericWorkerId),
    enabled: !isNaN(numericWorkerId),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['worker-public-reviews', numericWorkerId],
    queryFn: () => workerService.getWorkerReviews(numericWorkerId),
    enabled: !isNaN(numericWorkerId),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="flex gap-6 mb-8">
          <Skeleton className="w-32 h-32 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-4">Worker Not Found</h1>
        <p className="text-muted mb-6">The worker profile you're looking for doesn't exist.</p>
        <Link to="/workers">
          <Button>Browse Workers</Button>
        </Link>
      </div>
    );
  }

  const displayName = worker.profile?.full_name || worker.username;
  const profilePicture = worker.profile?.profile_picture;
  const location = worker.profile?.location;
  const hourlyRate = worker.profile?.hourly_rate;
  const bio = worker.profile?.bio;
  const skills = worker.profile?.skills || [];
  const experience = worker.profile?.experience_years;
  const availability = worker.profile?.availability;

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link 
        to="/workers" 
        className="inline-flex items-center gap-2 text-muted hover:text-navy mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Workers
      </Link>

      {/* Profile Header Card */}
      <div className="solid-card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar
              src={profilePicture}
              name={displayName}
              size="xl"
              className="w-32 h-32"
            />
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-charcoal mb-1">{displayName}</h1>
                <p className="text-muted">@{worker.username}</p>
              </div>
              {worker.is_verified && (
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <ShieldCheckIcon className="w-4 h-4" />
                  Verified
                </div>
              )}
            </div>

            {/* Location & Rate */}
            <div className="flex flex-wrap gap-4 mt-4">
              {location && (
                <div className="flex items-center gap-2 text-muted">
                  <MapPinIcon className="w-5 h-5" />
                  {location}
                </div>
              )}
              {hourlyRate && (
                <div className="flex items-center gap-2 text-navy font-semibold">
                  <CurrencyDollarIcon className="w-5 h-5" />
                  ${hourlyRate}/hr
                </div>
              )}
              {avgRating > 0 && (
                <div className="flex items-center gap-1 text-amber-500">
                  <StarSolidIcon className="w-5 h-5" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-muted">({reviews.length} reviews)</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {bio && (
              <p className="mt-4 text-charcoal">{bio}</p>
            )}

            {/* Quick Info */}
            <div className="flex flex-wrap gap-4 mt-4">
              {experience !== undefined && (
                <div className="flex items-center gap-2 text-muted">
                  <BriefcaseIcon className="w-5 h-5" />
                  {experience} years experience
                </div>
              )}
              {availability && (
                <div className="flex items-center gap-2 text-muted">
                  <ClockIcon className="w-5 h-5" />
                  {availability}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Link to={`/messages?user=${worker.id}`}>
                <Button leftIcon={<EnvelopeIcon className="w-4 h-4" />}>
                  Message
                </Button>
              </Link>
              {worker.profile?.phone && (
                <a href={`tel:${worker.profile.phone}`}>
                  <Button variant="secondary" leftIcon={<PhoneIcon className="w-4 h-4" />}>
                    Call
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="solid-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: any) => (
              <span 
                key={skill.id || skill.name}
                className="px-3 py-1 bg-navy-50 text-navy-700 rounded-full text-sm font-medium"
              >
                {skill.name || skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="solid-card p-6">
        <h2 className="text-lg font-semibold text-charcoal mb-4">
          Reviews ({reviews.length})
        </h2>
        
        {reviews.length === 0 ? (
          <p className="text-muted">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review: any) => (
              <div key={review.id} className="border-b border-charcoal-100 pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy font-semibold">
                      {review.reviewer?.username?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">
                        {review.reviewer?.profile?.full_name || review.reviewer?.username || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-charcoal-200'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-muted">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-charcoal mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerProfile;
