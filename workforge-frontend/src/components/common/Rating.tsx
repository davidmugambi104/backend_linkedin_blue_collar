import React from 'react';

interface RatingProps {
  rating: number;
  total?: number;
  onRate?: (rating: number) => void;
}

export const Rating: React.FC<RatingProps> = ({ rating, total, onRate }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-yellow-400">★</span>
      <span>{rating.toFixed(1)}</span>
      {total && <span className="text-gray-500">({total} ratings)</span>}
    </div>
  );
};
