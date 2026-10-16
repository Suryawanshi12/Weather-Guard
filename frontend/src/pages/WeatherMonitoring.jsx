import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import MetricBadge from '../components/MetricBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';

export default function WeatherMonitoring() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 50, total_pages: 1 });

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const fetchWeather = useCallback(async () => {
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
      if (status !== 'all') params.status = status;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (minTemp !== '') params.min_temp = parseFloat(minTemp);
      if (maxTemp !== '') params.max_temp = parseFloat(maxTemp);

      const res = await api.getWeather(params);
      setData(res);
    } catch (err) {
      console.error('Failed to load weather monitoring records:', err);
      setError(err.response?.data?.detail || err.message || 'Error fetching weather records.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, search, status, startDate, endDate, minTemp, maxTemp]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setMinTemp('');
    setMaxTemp('');
    setSortBy('time');
    setSortDir('asc');
    setPage(1);
  };

  const exportUrl = api.getWeatherExportUrl({
    search: search.trim() || undefined,
    status: status !== 'all' ? status : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    min_temp: minTemp !== '' ? minTemp : undefined,
    max_temp: maxTemp !== '' ? maxTemp : undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
  });

  const renderSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 inline ml-1" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-cyan-600 inline ml-1 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-cyan-600 inline ml-1 font-bold" />
    );
  };

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={fetchWeather} />}

      {/* Filter and Action Controls Bar */}
      <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by date (e.g. 2024-10-15) or status..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={exportUrl}
              download
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm hover:border-slate-400 transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-600" />
              <span>Export CSV</span>
            </a>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Status select */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Prediction Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Records (1,555)</option>
              <option value="Normal">Normal Only (1,429)</option>
              <option value="Potential Anomaly">Potential Anomalies Only (126)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Temperature Range */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Temp Range (°C)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Min"
                value={minTemp}
                onChange={(e) => {
                  setMinTemp(e.target.value);
                  setPage(1);
                }}
                className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxTemp}
                onChange={(e) => {
                  setMaxTemp(e.target.value);
                  setPage(1);
                }}
                className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Querying meteorological observations..." />
        ) : data.items.length === 0 ? (
          <EmptyState
            title="No weather readings match your query"
            description="Clear search or relax the temperature / date filters to see records."
            onReset={handleResetFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th
                    onClick={() => handleSort('time')}
                    className="px-4 py-3 cursor-pointer group hover:bg-slate-100/60 select-none"
                  >
                    Timestamp {renderSortIcon('time')}
                  </th>
                  <th
                    onClick={() => handleSort('temp')}
                    className="px-4 py-3 cursor-pointer group hover:bg-slate-100/60 select-none"
                  >
                    Temperature {renderSortIcon('temp')}
                  </th>
                  <th
                    onClick={() => handleSort('rhum')}
                    className="px-4 py-3 cursor-pointer group hover:bg-slate-100/60 select-none"
                  >
                    Humidity {renderSortIcon('rhum')}
                  </th>
                  <th
                    onClick={() => handleSort('temp_change')}
                    className="px-4 py-3 cursor-pointer group hover:bg-slate-100/60 select-none"
                  >
                    Δ Temp (1h) {renderSortIcon('temp_change')}
                  </th>
                  <th
                    onClick={() => handleSort('humidity_change')}
                    className="px-4 py-3 cursor-pointer group hover:bg-slate-100/60 select-none"
                  >
                    Δ Rhum (1h) {renderSortIcon('humidity_change')}
                  </th>
                  <th
                    onClick={() => handleSort('anomaly_score')}
                    className="px-4 py-3 cursor-pointer group hover:bg-slate-100/60 select-none"
                  >
                    Decision Score {renderSortIcon('anomaly_score')}
                  </th>
                  <th className="px-4 py-3">Model Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      row.prediction === -1 ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{row.time}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.temp}°C</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.rhum}%</td>
                    <td className="px-4 py-3 font-mono">
                      {row.temp_change !== null ? (
                        <span className={row.temp_change > 0 ? 'text-amber-600 font-medium' : 'text-blue-600 font-medium'}>
                          {row.temp_change > 0 ? `+${row.temp_change}` : row.temp_change}°C
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A (gap)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.humidity_change !== null ? (
                        <span className={row.humidity_change > 0 ? 'text-blue-600 font-medium' : 'text-amber-600 font-medium'}>
                          {row.humidity_change > 0 ? `+${row.humidity_change}` : row.humidity_change}%
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A (gap)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      <span className={row.anomaly_score < 0 ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                        {row.anomaly_score?.toFixed(5)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <MetricBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-4 py-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing <span className="font-semibold text-slate-900">{data.items.length > 0 ? (data.page - 1) * data.limit + 1 : 0}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(data.page * data.limit, data.total)}
              </span> of <span className="font-semibold text-slate-900">{data.total}</span> records
            </span>
            <span className="text-slate-300">|</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!data.has_prev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-slate-700">
              Page {data.page} of {data.total_pages}
            </span>
            <button
              type="button"
              disabled={!data.has_next}
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
