import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sliders,
  BarChart2,
  AlertCircle,
  Play,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import api from '../services/api';
import MetricBadge from '../components/MetricBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

export default function ModelAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Live Predictor form state
  const [predForm, setPredForm] = useState({
    temp: 12.0,
    rhum: 65.0,
    temp_change: 0.5,
    humidity_change: -2.0,
    hour: 14,
    month: 10,
  });
  const [predLoading, setPredLoading] = useState(false);
  const [predResult, setPredResult] = useState(null);
  const [predError, setPredError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [infoRes, evalRes, analyticsRes] = await Promise.all([
          api.getModelInfo(),
          api.getEvaluation(),
          api.getAnalytics(),
        ]);
        setModelInfo(infoRes);
        setEvaluation(evalRes);
        setAnalytics(analyticsRes);
      } catch (err) {
        console.error('Failed to load model analysis data:', err);
        setError(err.response?.data?.detail || err.message || 'Error querying model analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    try {
      setPredLoading(true);
      setPredError(null);
      const payload = {
        temp: parseFloat(predForm.temp),
        rhum: parseFloat(predForm.rhum),
        temp_change: predForm.temp_change !== '' ? parseFloat(predForm.temp_change) : null,
        humidity_change: predForm.humidity_change !== '' ? parseFloat(predForm.humidity_change) : null,
        hour: predForm.hour !== '' ? parseInt(predForm.hour, 10) : null,
        month: predForm.month !== '' ? parseInt(predForm.month, 10) : null,
      };
      const res = await api.predict(payload);
      setPredResult(res);
    } catch (err) {
      console.error('Inference error:', err);
      setPredError(err.response?.data?.detail || err.message || 'Prediction failed.');
    } finally {
      setPredLoading(false);
    }
  };

  const setPresetScenario = (scenario) => {
    if (scenario === 'normal') {
      setPredForm({
        temp: 8.5,
        rhum: 72.0,
        temp_change: 0.2,
        humidity_change: -1.0,
        hour: 12,
        month: 10,
      });
    } else if (scenario === 'flash_drop') {
      setPredForm({
        temp: -8.0,
        rhum: 90.0,
        temp_change: -9.5,
        humidity_change: 28.0,
        hour: 15,
        month: 11,
      });
    } else if (scenario === 'summer_heat') {
      setPredForm({
        temp: 34.0,
        rhum: 22.0,
        temp_change: 4.8,
        humidity_change: -15.0,
        hour: 14,
        month: 7,
      });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading model architecture and evaluation data..." size="lg" />;
  }

  const scoreChartData = (analytics?.score_distribution || []).map((b) => ({
    label: b.label,
    count: b.count,
    isAnomaly: b.bucket_max <= 0,
  }));

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}

      {/* Model Overview & Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-cyan-700">
            <Cpu className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Model Architecture</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Algorithm</span>
              <span className="font-semibold text-slate-800">Isolation Forest</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Trees (n_estimators)</span>
              <span className="font-mono font-semibold text-slate-800">200</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Contamination Ratio</span>
              <span className="font-mono font-semibold text-slate-800">0.05 (5.0%)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Random State</span>
              <span className="font-mono font-semibold text-slate-800">42 (reproducible)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-blue-700">
            <Sliders className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Preprocessing Pipeline</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Feature Scaler</span>
              <span className="font-semibold text-slate-800">StandardScaler (Train-fit)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Missing Value Imputation</span>
              <span className="font-semibold text-slate-800">Training Medians</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Chronological Split</span>
              <span className="font-mono font-semibold text-slate-800">80% Train / 20% Test</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Feature Count</span>
              <span className="font-mono font-semibold text-slate-800">6 Input Dimensions</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-700">
            <FileCheck2 className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Dataset Scope</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Station ID</span>
              <span className="font-mono font-semibold text-slate-800">02956 (2024 observations)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Training Records</span>
              <span className="font-mono font-semibold text-slate-800">6,220 rows (Jan-Sep)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Holdout Test Records</span>
              <span className="font-mono font-semibold text-slate-800">1,555 rows (Oct-Dec)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Test Anomaly Rate</span>
              <span className="font-mono font-semibold text-rose-600">8.10% (126 / 1,555)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Score Distribution Histogram */}
      <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Anomaly Decision Score Distribution</h2>
          <p className="text-xs text-slate-500">
            Scores below 0.0 (red bars) represent isolated records flagged as Potential Anomalies. Scores &gt; 0.0 (blue bars) represent normal readings.
          </p>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#64748b' }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg shadow text-xs">
                        <p className="font-bold text-slate-800">Range: {d.label}</p>
                        <p className="text-slate-600">Count: <span className="font-bold">{d.count}</span> records</p>
                        <p className={d.isAnomaly ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                          {d.isAnomaly ? 'Anomaly Region (Score < 0)' : 'Normal Region (Score >= 0)'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isAnomaly ? '#EF4444' : '#06B6D4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SYNTHETIC EVALUATION BENCHMARK SECTION (Strictly Isolated & Disclaimed) */}
      <div className="p-6 rounded-xl bg-slate-900 text-white shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Synthetic Experiment Only
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Experimental Synthetic Benchmark
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Synthetic anomaly injection test (77 artificial anomalies injected into 1,555 test records)
            </p>
          </div>
        </div>

        {/* Mandatory Prominent Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">
              IMPORTANT SCIENTIFIC LIMITATION: Ground-Truth Notice
            </p>
            <p className="text-amber-200/90 leading-relaxed text-xs">
              {evaluation?.synthetic_experiment?.disclaimer}
            </p>
          </div>
        </div>

        {/* Synthetic Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Synthetic Accuracy</span>
            <div className="text-2xl font-extrabold text-cyan-400 mt-0.5">
              {evaluation?.synthetic_experiment?.accuracy}%
            </div>
            <span className="text-[10px] text-slate-400">Under synthetic normal assumption</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Synthetic Recall</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
              {evaluation?.synthetic_experiment?.recall}%
            </div>
            <span className="text-[10px] text-slate-400">Captured 77 / 77 artificial anomalies</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Synthetic Precision</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-0.5">
              {evaluation?.synthetic_experiment?.precision}%
            </div>
            <span className="text-[10px] text-slate-400">Reflects 126 unverified real detections</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Synthetic F1-Score</span>
            <div className="text-2xl font-extrabold text-blue-400 mt-0.5">
              {evaluation?.synthetic_experiment?.f1_score}%
            </div>
            <span className="text-[10px] text-slate-400">Harmonic mean of precision & recall</span>
          </div>
        </div>

        {/* Confusion Matrix & Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Matrix table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Synthetic Confusion Matrix
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-700 text-xs">
              <table className="w-full text-center">
                <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-2.5 text-left">Ground Truth (Synthetic)</th>
                    <th className="p-2.5">Predicted Normal</th>
                    <th className="p-2.5">Predicted Anomaly</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  <tr>
                    <td className="p-2.5 text-left font-sans text-slate-300">Assumed Normal (1,555)</td>
                    <td className="p-2.5 font-bold text-emerald-400 bg-emerald-950/20">
                      1,429 (True Neg)
                    </td>
                    <td className="p-2.5 font-bold text-amber-400 bg-amber-950/20">
                      126 (Hypothetical FP)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-left font-sans text-slate-300">Synthetic Injected (77)</td>
                    <td className="p-2.5 font-bold text-rose-400 bg-rose-950/20">
                      0 (False Neg)
                    </td>
                    <td className="p-2.5 font-bold text-cyan-400 bg-cyan-950/20">
                      77 (True Pos)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interpretation */}
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Why Precision is 37.93% in Synthetic Testing
            </h3>
            <p>
              The experimental evaluation assumed that <span className="font-semibold text-white">all 1,555 original observational readings were strictly normal</span>. Consequently, the 126 records flagged by Isolation Forest were statistically counted as &quot;False Positives&quot;, reducing precision.
            </p>
            <p>
              In reality, some of those 126 records represent legitimate atmospheric irregularities (e.g. abrupt frontal passages, sensor fluctuations, or severe nocturnal inversions). Without human meteorologist validation, true real-world precision cannot be ascertained.
            </p>
          </div>
        </div>
      </div>

      {/* REAL-TIME MODEL INFERENCE SANDBOX */}
      <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-100 text-cyan-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Live Anomaly Predictor Sandbox
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate weather conditions and execute real-time inference against the backend Isolation Forest model
            </p>
          </div>

          {/* Scenarios presets */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Scenarios:</span>
            <button
              type="button"
              onClick={() => setPresetScenario('normal')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Normal Autumn
            </button>
            <button
              type="button"
              onClick={() => setPresetScenario('flash_drop')}
              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition-colors"
            >
              Cold Front Spike
            </button>
            <button
              type="button"
              onClick={() => setPresetScenario('summer_heat')}
              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium transition-colors"
            >
              Heatwave
            </button>
          </div>
        </div>

        <form onSubmit={handlePredictSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Inputs (2 cols) */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Temperature (°C) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={predForm.temp}
                onChange={(e) => setPredForm({ ...predForm, temp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-400">Valid range: -50.0 to 60.0°C</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Relative Humidity (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={predForm.rhum}
                onChange={(e) => setPredForm({ ...predForm, rhum: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-400">Valid range: 0.0 to 100.0%</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Temperature Change (1h Δ °C)
              </label>
              <input
                type="number"
                step="0.1"
                value={predForm.temp_change}
                onChange={(e) => setPredForm({ ...predForm, temp_change: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-400">Default: training median (0.0°C)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Humidity Change (1h Δ %)
              </label>
              <input
                type="number"
                step="0.1"
                value={predForm.humidity_change}
                onChange={(e) => setPredForm({ ...predForm, humidity_change: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-400">Default: training median (0.0%)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hour of Day (0 - 23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={predForm.hour}
                onChange={(e) => setPredForm({ ...predForm, hour: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-400">Diurnal cycle factor (0-23)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Month of Year (1 - 12)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={predForm.month}
                onChange={(e) => setPredForm({ ...predForm, month: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-400">Seasonal factor (1-12)</span>
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={predLoading}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{predLoading ? 'Executing Inference...' : 'Run Real-Time Anomaly Prediction'}</span>
              </button>
            </div>
          </div>

          {/* Results Output Panel (1 col) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Inference Output
              </span>

              {predError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {predError}
                </div>
              )}

              {predResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Classification</span>
                    <MetricBadge status={predResult.status} size="md" />
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                    <span className="text-[11px] text-slate-400 block">Decision Score</span>
                    <span className={`text-xl font-bold font-mono ${predResult.is_anomaly ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {predResult.anomaly_score?.toFixed(6)}
                    </span>
                    <p className="text-[11px] text-slate-500">{predResult.confidence_description}</p>
                  </div>

                  {predResult.scaled_features && (
                    <div className="space-y-1 text-[11px]">
                      <span className="font-semibold text-slate-700 block">Standardized Z-Scores:</span>
                      <div className="grid grid-cols-2 gap-1 font-mono text-slate-600">
                        {Object.entries(predResult.scaled_features).map(([k, v]) => (
                          <div key={k} className="truncate">
                            {k}: <span className="font-semibold">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 leading-tight italic pt-2 border-t border-slate-200">
                    {predResult.notice}
                  </p>
                </div>
              ) : (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center text-xs text-slate-400">
                  <Sliders className="w-8 h-8 text-slate-300 mb-2" />
                  Submit the form to see real-time Isolation Forest classification.
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
