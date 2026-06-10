export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 animate-pulse transition-colors">
      <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-16 bg-gray-100 dark:bg-slate-700 rounded"></div>
        <div className="h-16 bg-gray-100 dark:bg-slate-700 rounded"></div>
      </div>
      <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
        <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-100 dark:bg-slate-700 rounded-full w-20"></div>
          <div className="h-6 bg-gray-100 dark:bg-slate-700 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-100 dark:bg-slate-700 rounded mb-2"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-50 dark:bg-slate-800 rounded mb-1"></div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div>
      <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-6 animate-pulse"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
        <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
