import React from 'react';

/** Product Card Skeleton Loading Component */
export function ProductCardSkeleton() {
  return (
    <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse flex flex-col justify-between h-56">
      <div>
        <div className="h-28 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 mb-3" />
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md mb-1.5" />
        <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

/** Table Order Item Skeleton Component */
export function OrderItemSkeleton() {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 animate-pulse flex items-center justify-between">
      <div className="space-y-1.5 flex-1">
        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-md" />
        <div className="h-3 w-1/4 bg-slate-200/60 dark:bg-slate-800 rounded-md" />
      </div>
      <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
    </div>
  );
}
