import React from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Activity,
} from 'lucide-react';

export default function AtmosphereVisualizer({ observation, prediction, anomalyScore, status, isAnomaly }) {
  if (!observation) return null;

  const {
    location,
    temp,
    rhum,
    temp_change,
    humidity_change,
    weather_code = 0,
    condition_text = 'Clear Sky',
    wind_speed = 0,
    is_day = 1,
    hour = 12,
  } = observation;

  // Derive atmospheric background and icon
  const getWeatherTheme = () => {
    // Thunderstorm
    if (weather_code >= 95) {
      return {
        bg: 'from-slate-900 via-indigo-950 to-slate-900',
        textColor: 'text-indigo-200',
        icon: CloudLightning,
        effect: 'lightning',
      };
    }
    // Snow
    if (weather_code >= 71 && weather_code <= 77) {
      return {
        bg: 'from-blue-950 via-slate-900 to-cyan-950',
        textColor: 'text-cyan-100',
        icon: CloudSnow,
        effect: 'snow',
      };
    }
    // Rain
    if (weather_code >= 51 && weather_code <= 82) {
      return {
        bg: 'from-slate-900 via-cyan-950 to-blue-950',
        textColor: 'text-cyan-200',
        icon: CloudRain,
        effect: 'rain',
      };
    }
    // Fog
    if (weather_code === 45 || weather_code === 48) {
      return {
        bg: 'from-slate-800 via-zinc-800 to-slate-900',
        textColor: 'text-slate-300',
        icon: CloudFog,
        effect: 'fog',
      };
    }
    // Clouds
    if (weather_code >= 1 && weather_code <= 3) {
      return {
        bg: is_day
          ? 'from-sky-800 via-cyan-900 to-slate-900'
          : 'from-slate-950 via-indigo-950 to-slate-900',
        textColor: 'text-sky-100',
        icon: Cloud,
        effect: 'clouds',
      };
    }
    // Clear
    return {
      bg: is_day
        ? 'from-amber-600 via-cyan-800 to-blue-900'
        : 'from-indigo-950 via-slate-900 to-navy-950',
      textColor: is_day ? 'text-amber-100' : 'text-indigo-200',
      icon: is_day ? Sun : Moon,
      effect: is_day ? 'sunlight' : 'stars',
    };
  };

  const theme = getWeatherTheme();
  const WeatherIcon = theme.icon;

  // Threat gauge rotation angle (-90deg to +90deg)
  // Anomaly score ranges from approx -0.12 (extreme anomaly) to +0.08 (typical normal)
  // 0.0 is the exact decision boundary
  const normalizedScore = Math.max(-0.12, Math.min(0.08, anomalyScore ?? 0));
  const gaugeAngle = ((normalizedScore + 0.12) / 0.20) * 180 - 90;

  return (
    <div className="space-y-4">
      {/* Sky Canvas Card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.bg} p-6 text-white shadow-xl border border-white/10`}>
        {/* Animated Background Atmosphere Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          {theme.effect === 'stars' && (
            <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px] animate-pulse"></div>
          )}
          {theme.effect === 'sunlight' && (
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-amber-400/30 blur-3xl"></div>
          )}
          {theme.effect === 'rain' && (
            <div className="absolute inset-0 flex justify-around opacity-40">
              <span className="w-0.5 h-12 bg-cyan-300 animate-bounce" style={{ animationDuration: '0.8s' }}></span>
              <span className="w-0.5 h-16 bg-cyan-300 animate-bounce" style={{ animationDuration: '0.6s' }}></span>
              <span className="w-0.5 h-10 bg-cyan-300 animate-bounce" style={{ animationDuration: '0.9s' }}></span>
              <span className="w-0.5 h-14 bg-cyan-300 animate-bounce" style={{ animationDuration: '0.7s' }}></span>
            </div>
          )}
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live Real-World Atmosphere
              </span>
              <span className="text-xs text-white/70 font-mono">{hour}:00 Local</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
              {location}
            </h3>
            <p className="text-xs text-white/80 font-medium flex items-center gap-1.5 mt-0.5">
              <span>{condition_text}</span>
              <span>•</span>
              <span>Wind {wind_speed} km/h</span>
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-white">
            <WeatherIcon className="w-8 h-8 animate-pulse text-amber-300" />
          </div>
        </div>

        {/* Big Temperature Hero Section */}
        <div className="relative z-10 mt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black tracking-tighter text-white drop-shadow-md">
              {temp}°
            </span>
            <span className="text-xl sm:text-2xl font-bold text-white/80">C</span>
            <div className="ml-3 pl-3 border-l border-white/20 text-xs text-white/90 space-y-0.5">
              <div>
                Δ Temp (1h):{' '}
                <span className={`font-bold font-mono ${temp_change > 0 ? 'text-amber-300' : 'text-cyan-300'}`}>
                  {temp_change > 0 ? `+${temp_change}` : temp_change}°C
                </span>
              </div>
              <div>
                Δ Humidity (1h):{' '}
                <span className={`font-bold font-mono ${humidity_change > 0 ? 'text-cyan-300' : 'text-amber-300'}`}>
                  {humidity_change > 0 ? `+${humidity_change}` : humidity_change}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3.5 py-1.5 rounded-xl border backdrop-blur-md flex items-center gap-2 ${
              isAnomaly
                ? 'bg-rose-500/30 text-rose-200 border-rose-400/50 shadow-rose-900/40'
                : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50 shadow-emerald-900/40'
            }`}>
              <Activity className="w-4 h-4" />
              <div>
                <span className="text-[10px] uppercase font-bold block opacity-80">AI Assessment</span>
                <span className="text-xs font-extrabold">{status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Live Dials & Gauges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Thermometer Dial */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-500" />
              Thermal Gauge
            </span>
            <span className="font-mono text-slate-700">{temp}°C</span>
          </div>

          <div className="my-3 space-y-1.5">
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 via-emerald-400 via-amber-400 to-rose-600 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, ((temp + 20) / 65) * 100))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-20°C (Freeze)</span>
              <span>15°C</span>
              <span>45°C (Extreme)</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-500">
            {temp < 0 ? 'Sub-zero freezing atmospheric regime' : temp < 18 ? 'Cool temperate condition' : temp < 30 ? 'Warm ambient conditions' : 'Elevated thermal range'}
          </span>
        </div>

        {/* Relative Humidity Dial */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-500" />
              Humidity Level
            </span>
            <span className="font-mono text-slate-700">{rhum}%</span>
          </div>

          <div className="my-3 space-y-1.5">
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, rhum))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0% (Arid)</span>
              <span>50%</span>
              <span>100% (Saturated)</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-500">
            {rhum < 35 ? 'Arid / Low moisture atmosphere' : rhum < 75 ? 'Optimal atmospheric moisture balance' : 'Saturated / Precipitation-prone'}
          </span>
        </div>

        {/* Isolation Forest Threat Radar Meter */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-indigo-500" />
              iForest Anomaly Meter
            </span>
            <span className={`font-mono font-bold ${isAnomaly ? 'text-rose-600' : 'text-emerald-600'}`}>
              {anomalyScore?.toFixed(4)}
            </span>
          </div>

          <div className="my-3 space-y-1.5">
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isAnomaly ? 'bg-gradient-to-r from-rose-600 to-amber-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, ((anomalyScore + 0.10) / 0.18) * 100))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span className="text-rose-600 font-bold">&lt; 0.0 (Anomaly)</span>
              <span className="text-slate-400">0.0 (Boundary)</span>
              <span className="text-emerald-600 font-bold">&gt; 0.0 (Normal)</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-500">
            {isAnomaly ? 'Isolated spatial path length divergence detected' : 'Conforms to historical baseline distribution'}
          </span>
        </div>
      </div>
    </div>
  );
}
