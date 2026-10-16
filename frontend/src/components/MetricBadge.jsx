import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function MetricBadge({ status, severity, size = 'sm' }) {
  const isAnomaly = status === 'Potential Anomaly' || status === 'Anomaly' || status === -1;

  if (!isAnomaly) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}>
        <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5 text-emerald-600' : 'w-4 h-4 text-emerald-600'} />
        Normal
      </span>
    );
  }

  // Severity styling
  const severityColors = {
    Severe: 'bg-rose-50 text-rose-700 border-rose-200',
    Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    Mild: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const badgeClass = severityColors[severity] || 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${badgeClass} ${
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    }`}>
      {severity === 'Severe' ? (
        <AlertOctagon className={size === 'sm' ? 'w-3.5 h-3.5 text-rose-600' : 'w-4 h-4 text-rose-600'} />
      ) : (
        <AlertTriangle className={size === 'sm' ? 'w-3.5 h-3.5 text-amber-600' : 'w-4 h-4 text-amber-600'} />
      )}
      <span>Potential Anomaly</span>
      {severity && (
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
          ({severity})
        </span>
      )}
    </span>
  );
}
