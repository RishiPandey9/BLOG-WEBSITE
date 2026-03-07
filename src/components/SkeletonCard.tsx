export function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      {/* Cover image placeholder */}
      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4" />
      {/* Category + reading time */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded-full ml-auto" />
      </div>
      {/* Title */}
      <div className="space-y-2 mb-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-full" />
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-4/5" />
      </div>
      {/* Excerpt */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" />
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-5/6" />
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-3/4" />
      </div>
      {/* Author + stats row */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-10 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-4 w-10 bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
