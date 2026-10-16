import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Gauge,
  TrendingDown,
  Layers,
  Thermometer,
  Droplets,
  Clock,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import MetricBadge from '../components/MetricBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';

export default function AnomalyDetection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 50, total_pages: 1 });
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('anomaly_score');
  const [sortDir, setSortDir] = useState('asc'); // asc = most negative score first
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const fetchAnomalies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_dir: sortDir,
      };

      if (search.trim()) params.search = search.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.getAnomalies(params);
      setData(res);

      // Select first item by default if detail panel has none
      if (!selectedRecord && res.items?.length > 0) {
        setSelectedRecord(res.items[0]);
      }
    } catch (err) {
      console.error('Failed to load anomaly records:', err);
      setError(err.response?.data?.detail || err.message || 'Error querying anomaly records.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, search, startDate, endDate]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const handleSelectRecord = (record) => {
    setSelectedRecord(record);
  };

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={fetchAnomalies} />}

      {/* Methodology & Warning Callout */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">
            Unsupervised Statistical Outlier Assessment
          </p>
          <p className="text-amber-800 leading-relaxed">
            All flagged observations are classified as <span className="font-bold">“Potential Anomalies”</span> based on low Isolation Forest decision scores (&lt; 0.0). These represent statistical divergence from the historical training distribution—they are <span className="underline decoration-amber-500 font-medium">not verified severe weather alerts or confirmed instrumentation faults</span>.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anomaly timestamp..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="anomaly_score">Score (Most Anomalous First)</option>
              <option value="time">Timestamp</option>
              <option value="temp">Temperature</option>
              <option value="rhum">Humidity</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 border border-slate-300 rounded-lg bg-white text-slate-700"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 border border-slate-300 rounded-lg bg-white text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Anomaly Table (left) + Interactive Detail Panel (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          {loading ? (
            <LoadingSpinner text="Retrieving verified test set anomalies..." />
          ) : data.items.length === 0 ? (
            <EmptyState
              title="No potential anomalies found"
              description="No anomaly records match the selected date or search filter."
              onReset={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-3 py-3">Temp</th>
                    <th className="px-3 py-3">RH</th>
                    <th className="px-3 py-3">Δ Temp</th>
                    <th className="px-3 py-3">Δ RH</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((row, idx) => {
                    const isSelected = selectedRecord?.time === row.time;
                    return (
                      <tr
                        key={idx}
                        onClick={() => handleSelectRecord(row)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-50/70 border-l-4 border-l-cyan-600'
                            : 'hover:bg-slate-50/90'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{row.time}</td>
                        <td className="px-3 py-3 font-semibold text-slate-800">{row.temp}°C</td>
                        <td className="px-3 py-3 font-semibold text-slate-800">{row.rhum}%</td>
                        <td className="px-3 py-3 font-mono text-xs">
                          {row.temp_change !== null ? (
                            <span className={row.temp_change > 0 ? 'text-amber-600' : 'text-blue-600'}>
                              {row.temp_change > 0 ? `+${row.temp_change}` : row.temp_change}°C
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs">
                          {row.humidity_change !== null ? (
                            <span className={row.humidity_change > 0 ? 'text-blue-600' : 'text-amber-600'}>
                              {row.humidity_change > 0 ? `+${row.humidity_change}` : row.humidity_change}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-rose-600">
                          {row.anomaly_score?.toFixed(5)}
                        </td>
                        <td className="px-4 py-3">
                          <MetricBadge status="Potential Anomaly" severity={row.severity} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing <span className="font-semibold text-slate-900">{data.items.length > 0 ? (data.page - 1) * data.limit + 1 : 0}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(data.page * data.limit, data.total)}
              </span> of <span className="font-semibold text-slate-900">{data.total}</span> anomalies
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!data.has_prev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium px-2">
                {data.page} / {data.total_pages}
              </span>
              <button
                type="button"
                disabled={!data.has_next}
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Record Detail Inspector Panel (1 col) */}
        <div className="space-y-4">
          {selectedRecord ? (
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-5 sticky top-20">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Observation Inspector</span>
                  <h3 className="text-base font-bold text-slate-900 font-mono mt-0.5">{selectedRecord.time}</h3>
                </div>
                <MetricBadge status="Potential Anomaly" severity={selectedRecord.severity} size="md" />
              </div>

              {/* Anomaly Score Highlight */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Isolation Forest Score</span>
                  <span className="font-bold text-slate-700">Threshold: &lt; 0.00</span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-rose-600">
                  {selectedRecord.anomaly_score?.toFixed(6)}
                </div>
                <p className="text-[11px] text-slate-500">
                  {selectedRecord.anomaly_score < -0.05
                    ? 'Severe divergence: High distance from average isolation tree paths.'
                    : selectedRecord.anomaly_score < -0.02
                    ? 'Moderate divergence: Noticeable shift in rate-of-change or diurnal pattern.'
                    : 'Mild divergence: Borderline outlier close to decision boundary.'}
                </p>
              </div>

              {/* Feature Breakdown Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Meteorological Dimensions</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block font-medium">Temperature</span>
                    <span className="text-sm font-bold text-slate-800">{selectedRecord.temp}°C</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block font-medium">Relative Humidity</span>
                    <span className="text-sm font-bold text-slate-800">{selectedRecord.rhum}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block font-medium">Δ Temp (1h)</span>
                    <span className="text-sm font-bold font-mono text-slate-800">
                      {selectedRecord.temp_change !== null ? `${selectedRecord.temp_change}°C` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block font-medium">Δ Rhum (1h)</span>
                    <span className="text-sm font-bold font-mono text-slate-800">
                      {selectedRecord.humidity_change !== null ? `${selectedRecord.humidity_change}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block font-medium">Hour of Day</span>
                    <span className="text-sm font-bold font-mono text-slate-800">{selectedRecord.hour}:00</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block font-medium">Month</span>
                    <span className="text-sm font-bold font-mono text-slate-800">{selectedRecord.month} (2024)</span>
                  </div>
                </div>
              </div>

              {/* Why this was flagged */}
              <div className="p-3.5 rounded-lg bg-cyan-50/70 border border-cyan-200/80 text-xs text-cyan-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-cyan-950">
                  <Gauge className="w-3.5 h-3.5 text-cyan-700" />
                  Isolation Mechanics
                </span>
                <p className="text-cyan-800 leading-relaxed text-[11px]">
                  Isolation Forest isolates anomalies by randomly partitioning feature dimensions. Records with rapid temperature or humidity spikes require fewer splits to be separated from typical clusters.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-white border border-slate-200/80 text-center text-xs text-slate-400">
              Select any anomaly row to view feature contributions and metric diagnostics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
