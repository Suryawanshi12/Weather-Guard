import React from 'react';
import {
  Info,
  ShieldAlert,
  GitBranch,
  Layers,
  Database,
  Calendar,
  Compass,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-navy-900 to-slate-900 text-white shadow-md space-y-3">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 inline-block">
          Technical Specification & Architecture
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          WeatherGuard Methodology & Model Guide
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
          A rigorous machine learning approach to statistical atmospheric anomaly detection on continuous station telemetry using tree-based spatial partitioning.
        </p>
      </div>

      {/* Distinction Section: Anomaly Detection vs Weather Forecasting */}
      <div className="p-5 rounded-xl bg-cyan-50/70 border border-cyan-200/80 text-cyan-950 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-700" />
          <h2 className="text-base font-bold">Anomaly Detection vs. Weather Forecasting</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-cyan-900 leading-relaxed">
          <div className="p-3.5 rounded-lg bg-white/90 border border-cyan-100 space-y-1.5">
            <span className="font-bold text-cyan-950 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-cyan-600" />
              What WeatherGuard Does (Anomaly Detection)
            </span>
            <p>
              WeatherGuard operates as an <span className="font-semibold">unsupervised pattern detector</span>. It evaluates observational readings (current temperature, humidity, rates of change, and diurnal/seasonal factors) and assigns a score quantifying how rare or isolated that reading is relative to historical baseline distributions.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-white/90 border border-cyan-100 space-y-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              What WeatherGuard Does NOT Do (Forecasting)
            </span>
            <p>
              WeatherGuard is <span className="font-semibold text-rose-700">not a weather forecasting model</span>. It does not predict future barometric pressure, rainfall amounts, storm trajectories, or tomorrow&apos;s high temperatures. It also does not issue official meteorological warnings or severe weather advisories.
            </p>
          </div>
        </div>
      </div>

      {/* Isolation Forest Mechanics */}
      <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <GitBranch className="w-5 h-5 text-cyan-600" />
          <h2 className="text-base font-bold tracking-tight">How Isolation Forest Works</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Unlike distance- or density-based anomaly detectors that suffer from high computational complexity, the <span className="font-semibold text-slate-900">Isolation Forest (iForest)</span> algorithm exploits two fundamental properties of anomalous observations: they are <span className="italic">few in number</span> and have <span className="italic">atypical attribute values</span>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-800">1. Random Partitioning</span>
            <p className="text-slate-500">
              The algorithm recursively subdivides feature space by randomly selecting a feature and a random split value between its min and max.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-800">2. Short Path Lengths</span>
            <p className="text-slate-500">
              Anomalies exist in sparse regions of the feature manifold, requiring significantly fewer splits (shorter tree paths) to be isolated from normal clusters.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-800">3. Decision Function</span>
            <p className="text-slate-500">
              Average path length across 200 trees is converted to a score. Scores below 0.0 indicate high isolation depth (Potential Anomaly).
            </p>
          </div>
        </div>
      </div>

      {/* Input Features & Engineering */}
      <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Layers className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold tracking-tight">Engineered Feature Dimensions</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600">
          The model consumes exactly 6 engineered features in verified chronological order:
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-200 text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Feature Name</th>
                <th className="p-3">Data Type</th>
                <th className="p-3">Scientific Rationale</th>
                <th className="p-3">Training Median (Imputation)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">temp</td>
                <td className="p-3 text-slate-500">Float (°C)</td>
                <td className="p-3 text-slate-700">Ambient surface temperature. Detects unseasonal cold or extreme heat.</td>
                <td className="p-3 font-mono text-cyan-700">10.0°C</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">rhum</td>
                <td className="p-3 text-slate-500">Float (%)</td>
                <td className="p-3 text-slate-700">Relative humidity. Captures extreme dryness or prolonged saturation.</td>
                <td className="p-3 font-mono text-cyan-700">84.0%</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">temp_change</td>
                <td className="p-3 text-slate-500">Float (°C/h)</td>
                <td className="p-3 text-slate-700">Hourly temperature first difference within continuous observation segments.</td>
                <td className="p-3 font-mono text-cyan-700">0.0°C</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">humidity_change</td>
                <td className="p-3 text-slate-500">Float (%/h)</td>
                <td className="p-3 text-slate-700">Hourly humidity rate of change. Identifies rapid dry-line or front shifts.</td>
                <td className="p-3 font-mono text-cyan-700">0.0%</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">hour</td>
                <td className="p-3 text-slate-500">Integer (0-23)</td>
                <td className="p-3 text-slate-700">Diurnal cycle index. Helps model diurnal temperature swing expectations.</td>
                <td className="p-3 font-mono text-cyan-700">12.0</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">month</td>
                <td className="p-3 text-slate-500">Integer (1-12)</td>
                <td className="p-3 text-slate-700">Seasonal index. Disallows summer heat norms from applying to winter months.</td>
                <td className="p-3 font-mono text-cyan-700">5.0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Provenance & Chronological Split */}
      <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Database className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold tracking-tight">Dataset Provenance & Split Strategy</h2>
        </div>
        <div className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed">
          <p>
            Observations originate from surface weather station <span className="font-semibold text-slate-900 font-mono">02956</span> spanning the complete year 2024.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
            <li>
              <span className="font-semibold text-slate-800">Physical Bounds Validation:</span> Temperatures restricted to [-50°C, 60°C] and relative humidity to [0%, 100%].
            </li>
            <li>
              <span className="font-semibold text-slate-800">Segment Continuity:</span> Readings are grouped into continuous temporal segments. First differences (<span className="font-mono">temp_change</span>, <span className="font-mono">humidity_change</span>) are strictly computed across adjacent hours, preserving NaN at segment boundaries rather than differencing across multi-hour gaps.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Strict Chronological 80/20 Split:</span> No random shuffling was performed to prevent temporal data leakage. The first 80% of readings (Jan 1, 2024 – Oct 1, 2024, 6,220 rows) form the training set; the remaining 20% (Oct 1, 2024 – Dec 31, 2024, 1,555 rows) form the holdout test set.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Fitted Scaler Isolation:</span> The StandardScaler was fitted strictly on the 6,220 training rows, and merely applied to the test rows and live inference calls.
            </li>
          </ul>
        </div>
      </div>

      {/* Limitations Section */}
      <div className="p-6 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-950 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold">Scientific Limitations & Integrity Disclosures</h2>
        </div>
        <div className="text-xs text-rose-900 space-y-2 leading-relaxed">
          <p>
            1. <span className="font-bold">Absence of Ground-Truth Labels:</span> Real-world atmospheric datasets typically lack verified binary tags denoting whether an unusual temperature swing was a valid microclimate anomaly, a faulty sensor, or a routine weather front.
          </p>
          <p>
            2. <span className="font-bold">Interpretation of Synthetic Metrics:</span> A previous experiment injected 77 artificial anomalies and reported 92.28% accuracy and 37.93% precision. This is strictly a benchmark measuring sensitivity to synthetic perturbations and cannot be cited as real-world operational accuracy.
          </p>
          <p>
            3. <span className="font-bold">Single-Station Scope:</span> This model is currently fitted to Station 02956. Spatial atmospheric correlations across neighboring stations or Doppler radar layers are not incorporated in this standalone version.
          </p>
        </div>
      </div>
    </div>
  );
}
