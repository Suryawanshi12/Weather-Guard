import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  Database,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Filter,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Radio, Globe, Sparkles } from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import MetricBadge from '../components/MetricBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import LiveWeatherModal from '../components/LiveWeatherModal';

export default function Overview({ onRefreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [summaryRes, anomaliesRes, weatherRes] = await Promise.all([
        api.getSummary(params),
        api.getAnomalies({ limit: 6, sort_by: 'anomaly_score', sort_dir: 'asc', ...params }),
        api.getWeather({ limit: 120, sort_by: 'time', sort_dir: 'asc', ...params }),
      ]);

      setSummary(summaryRes);
      setRecentAnomalies(anomaliesRes.items || []);

      // Format weather chart points (subsample or direct for clean rendering)
      const formattedPoints = (weatherRes.items || []).map((item) => ({
        time: item.time.slice(5, 16), // 'MM-DD HH:MM'
        temp: item.temp,
        rhum: item.rhum,
        score: item.anomaly_score,
        isAnomaly: item.prediction === -1,
      }));
      setChartData(formattedPoints);
    } catch (err) {
      console.error('Failed to fetch overview data:', err);
      setError(err.response?.data?.detail || err.message || 'Error connecting to WeatherGuard backend API.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData, onRefreshTrigger]);

  const handlePreset = (preset) => {
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'oct') {
      setStartDate('2024-10-01');
      setEndDate('2024-10-31');
    } else if (preset === 'nov') {
      setStartDate('2024-11-01');
      setEndDate('2024-11-30');
    } else if (preset === 'dec') {
      setStartDate('2024-12-01');
      setEndDate('2024-12-31');
    }
  };

  if (loading && !summary) {
    return <LoadingSpinner text="Fetching weather intelligence and anomaly data..." size="lg" />;
  }

  const pieData = summary
    ? [
        { name: 'Normal', value: summary.normal_count, color: '#10B981' },
        { name: 'Potential Anomaly', value: summary.anomaly_count, color: '#EF4444' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      {/* Live Real-World Ingestion Callout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-slate-900 to-cyan-950 text-white shadow-md border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
            <Globe className="w-5 h-5 animate-spin" style={{ animationDuration: '24s' }} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Live Real-World Weather Telemetry
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Open-Meteo API Active
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Fetch real-time temperatures &amp; humidity from any city worldwide, compute hourly atmospheric shifts, and run live Isolation Forest anomaly inference.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLiveModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg shadow-cyan-500/20 transition-all shrink-0 font-sans"
        >
          <Radio className="w-4 h-4 text-slate-900 animate-pulse" />
          <span>Ingest Real-Time Weather</span>
        </button>
      </div>

      <LiveWeatherModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        onDataIngested={fetchData}
      />

      {/* Date Range & Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Quick Range:
          </span>
          <button
            type="button"
            onClick={() => handlePreset('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              !startDate && !endDate ? 'bg-cyan-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Full Test Set (Oct-Dec)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('oct')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              startDate === '2024-10-01' && endDate === '2024-10-31'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            October 2024
          </button>
          <button
            type="button"
            onClick={() => handlePreset('nov')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              startDate === '2024-11-01' && endDate === '2024-11-30'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            November 2024
          </button>
          <button
            type="button"
            onClick={() => handlePreset('dec')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              startDate === '2024-12-01' && endDate === '2024-12-31'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            December 2024
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => handlePreset('all')}
              className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Weather Records"
          value={summary?.total_records?.toLocaleString() || 0}
          unit="readings"
          subtext={`Test Window: ${summary?.earliest_timestamp?.slice(0, 10)} → ${summary?.latest_timestamp?.slice(0, 10)}`}
          icon={Database}
          variant="cyan"
          badge="Station 02956"
        />
        <StatCard
          title="Normal Observations"
          value={summary?.normal_count?.toLocaleString() || 0}
          unit="readings"
          subtext="Consistent with baseline seasonal norms"
          icon={CheckCircle}
          variant="emerald"
          badge={`${summary?.total_records ? ((summary.normal_count / summary.total_records) * 100).toFixed(1) : 0}%`}
        />
        <StatCard
          title="Potential Anomalies"
          value={summary?.anomaly_count?.toLocaleString() || 0}
          unit="readings"
          subtext="Statistical outliers flagged by iForest"
          icon={AlertTriangle}
          variant="danger"
          badge={`${summary?.anomaly_percentage || 0}% rate`}
        />
        <StatCard
          title="Avg Temperature & Humidity"
          value={summary?.temperature_summary?.mean !== undefined ? `${summary.temperature_summary.mean}°C` : '—'}
          unit={`/ ${summary?.humidity_summary?.mean || 0}% RH`}
          subtext={`Temp range: ${summary?.temperature_summary?.min ?? '—'}°C to ${summary?.temperature_summary?.max ?? '—'}°C`}
          icon={Thermometer}
          variant="amber"
          badge="Observed"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temperature & Humidity Time Series (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Weather Timeline & Dynamics</h2>
              <p className="text-xs text-slate-500">Hourly Temperature (°C) and Relative Humidity (%) sequence</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-cyan-600">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                Temp (°C)
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Humidity (%)
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} minTickGap={24} />
                <YAxis yAxisId="temp" orientation="left" tick={{ fontSize: 11, fill: '#0891b2' }} />
                <YAxis yAxisId="rhum" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#2563eb' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-white/95 backdrop-blur-sm rounded-lg border border-slate-200 shadow-lg text-xs space-y-1">
                          <p className="font-semibold text-slate-900">{label}</p>
                          <p className="text-cyan-700">Temperature: <span className="font-bold">{data.temp}°C</span></p>
                          <p className="text-blue-700">Humidity: <span className="font-bold">{data.rhum}%</span></p>
                          <p className="text-slate-600">Decision Score: <span className="font-mono">{data.score?.toFixed(4)}</span></p>
                          {data.isAnomaly && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold mt-1">
                              Flagged Potential Anomaly
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp"
                  stroke="#0891b2"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="rhum"
                  type="monotone"
                  dataKey="rhum"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Normal vs Anomaly Ratio Pie (1 col) */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Classification Ratio</h2>
            <p className="text-xs text-slate-500">Unsupervised Isolation Forest distribution</p>
          </div>

          <div className="h-[200px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} records (${((val / (summary?.total_records || 1)) * 100).toFixed(1)}%)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <span className="block font-semibold">Normal</span>
              <span className="text-base font-extrabold">{summary?.normal_count || 0}</span>
              <span className="block text-[10px] text-emerald-600">
                {summary?.total_records ? ((summary.normal_count / summary.total_records) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-800">
              <span className="block font-semibold">Potential Anomaly</span>
              <span className="text-base font-extrabold">{summary?.anomaly_count || 0}</span>
              <span className="block text-[10px] text-rose-600">{summary?.anomaly_percentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent High-Severity Anomalies Table Preview */}
      <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Top Detected Potential Anomalies
            </h2>
            <p className="text-xs text-slate-500">
              Sorted by highest divergence (most negative decision score)
            </p>
          </div>
          <Link
            to="/anomalies"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            <span>View All Anomalies</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200/80">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Temperature</th>
                <th className="px-4 py-3">Humidity</th>
                <th className="px-4 py-3">Δ Temp (1h)</th>
                <th className="px-4 py-3">Δ Rhum (1h)</th>
                <th className="px-4 py-3">Decision Score</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAnomalies.length > 0 ? (
                recentAnomalies.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{item.time}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.temp}°C</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.rhum}%</td>
                    <td className="px-4 py-3 font-mono">
                      {item.temp_change !== null ? (
                        <span className={item.temp_change > 0 ? 'text-amber-600' : 'text-blue-600'}>
                          {item.temp_change > 0 ? `+${item.temp_change}` : item.temp_change}°C
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {item.humidity_change !== null ? (
                        <span className={item.humidity_change > 0 ? 'text-blue-600' : 'text-amber-600'}>
                          {item.humidity_change > 0 ? `+${item.humidity_change}` : item.humidity_change}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-rose-600">
                      {item.anomaly_score?.toFixed(5)}
                    </td>
                    <td className="px-4 py-3">
                      <MetricBadge status="Potential Anomaly" severity={item.severity} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No anomalies found for current filter selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
