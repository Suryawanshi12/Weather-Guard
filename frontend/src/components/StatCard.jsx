import React from 'react';

export default function StatCard({
  title,
  value,
  unit,
  subtext,
  icon: Icon,
  variant = 'default',
  badge,
}) {
  const variantStyles = {
    default: {
      border: 'border-slate-200/80',
      iconBg: 'bg-slate-100 text-slate-700',
      accent: 'text-slate-900',
    },
    cyan: {
      border: 'border-cyan-200/80',
      iconBg: 'bg-cyan-50 text-cyan-600',
      accent: 'text-cyan-900',
    },
    amber: {
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-50 text-amber-600',
      accent: 'text-amber-900',
    },
    danger: {
      border: 'border-rose-200/80',
      iconBg: 'bg-rose-50 text-rose-600',
      accent: 'text-rose-900',
    },
    emerald: {
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-50 text-emerald-600',
      accent: 'text-emerald-900',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`p-5 rounded-xl bg-white border ${style.border} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${style.accent}`}>
              {value}
            </span>
            {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtext || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">{subtext}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
