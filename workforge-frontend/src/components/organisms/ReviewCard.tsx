import { StarIcon } from '@heroicons/react/24/solid';
import { Avatar, Button } from '@components/atoms';

export interface ReviewCardProps {
  name: string;
  date: string;
  rating: number;
  comment: string;
}

export const ReviewCard = ({ name, date, rating, comment }: ReviewCardProps) => (
  <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-level-1">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={name} size="md" />
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-yellow-500" aria-label={`Rating ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon key={index} className="h-4 w-4" aria-hidden="true" />
        ))}
      </div>
    </div>
    <p className="mt-3 text-sm text-gray-700">{comment}</p>
    <div className="mt-4 flex gap-2">
      <Button size="sm">Approve</Button>
      <Button size="sm" variant="secondary">Reject</Button>
      <Button size="sm" variant="tertiary">Reply</Button>
    </div>
  </article>
);
