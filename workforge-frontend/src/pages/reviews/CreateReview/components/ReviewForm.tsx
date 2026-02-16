import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';
import { RatingInput } from './RatingInput';
import { useJob } from '@hooks/useJobs';
import { useCreateReview } from '@hooks/useReviews';
import { useAuth } from '@context/AuthContext';
import { Skeleton } from '@components/ui/Skeleton';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100).optional(),
  comment: z.string().min(10, 'Review must be at least 10 characters'),
  pros: z.string().optional(),
  cons: z.string().optional(),
  would_recommend: z.boolean(),
  is_anonymous: z.boolean(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export const ReviewForm: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: job, isLoading: jobLoading } = useJob(Number(jobId));
  const createReview = useCreateReview();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      would_recommend: true,
      is_anonymous: false,
    },
  });

  const rating = watch('rating');

  const onSubmit = async (data: ReviewFormData) => {
    try {
      await createReview.mutateAsync({
        job_id: Number(jobId),
        ...data,
      });
      navigate(`/worker/reviews`);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  if (jobLoading) {
    return (
      <Card>
        <CardBody>
          <Skeleton className="h-96" />
        </CardBody>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-gray-500">Job not found</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Review Worker
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Job: {job.title} • Worker: {job.worker?.full_name}
        </p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Rating */}
          <RatingInput
            label="Overall Rating"
            value={rating}
            onChange={(value) => setValue('rating', value, { shouldValidate: true })}
            error={errors.rating?.message}
          />

          {/* Review Title */}
          <Input
            {...register('title')}
            label="Review Title"
            placeholder="Summarize your experience"
            error={errors.title?.message}
          />

          {/* Review Comment */}
          <Textarea
            {...register('comment')}
            label="Review"
            placeholder="Describe your experience working with this worker..."
            rows={5}
            error={errors.comment?.message}
            required
          />

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              {...register('pros')}
              label="Pros"
              placeholder="What went well?"
              rows={3}
              error={errors.pros?.message}
            />
            <Textarea
              {...register('cons')}
              label="Cons"
              placeholder="What could be improved?"
              rows={3}
              error={errors.cons?.message}
            />
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                {...register('would_recommend')}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I would recommend this worker
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                {...register('is_anonymous')}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Submit anonymously (your name will not be shown)
              </span>
            </label>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Review Guidelines
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Be honest and constructive in your feedback</li>
              <li>• Focus on the work quality and professionalism</li>
              <li>• Avoid personal attacks or inappropriate language</li>
              <li>• Don't include private contact information</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createReview.isPending}
              disabled={rating === 0}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};