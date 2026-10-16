import React from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search criteria or date filters.',
  onReset,
  icon: Icon = SearchX,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200/80 shadow-sm my-4">
      <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-400 mb-3.5">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
