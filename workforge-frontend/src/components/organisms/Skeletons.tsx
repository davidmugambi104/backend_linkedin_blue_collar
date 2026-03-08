export const CardSkeleton = () => <div className="h-32 animate-pulse rounded-lg bg-gray-100" />;

export const TableSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="h-12 animate-pulse border-b border-gray-100 bg-gray-50" />
    ))}
  </div>
);
