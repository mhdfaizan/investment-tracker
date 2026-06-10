export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-600 rounded w-1/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-16" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-14 bg-slate-100 dark:bg-slate-700 rounded" />
        <div className="h-14 bg-slate-100 dark:bg-slate-700 rounded" />
      </div>
      <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
        <div className="flex gap-2 items-center">
          <div className="w-[72px] h-[72px] bg-slate-100 dark:bg-slate-700 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-20" />
            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse transition-colors">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-32" />
      </div>
      <div className="p-5 space-y-3">
        <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-slate-50 dark:bg-slate-800 rounded" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-40 animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-60 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
