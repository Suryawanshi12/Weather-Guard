import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  X,
  Play,
  PlusCircle,
  RotateCcw,
  Thermometer,
  Droplets,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';
import MetricBadge from './MetricBadge';
import LoadingSpinner from './LoadingSpinner';

export default function LiveWeatherModal({ isOpen, onClose, onDataIngested }) {
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('berlin');
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function loadCities() {
        try {
          const presets = await api.getPresetCities();
          setCities(presets);
        } catch (e) {
          console.error('Failed to load preset cities', e);
        }
      }
      loadCities();
      setError(null);
      setIngestSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      setIngestSuccess(null);

      const payload = {};
      if (isCustom) {
        if (!customLat || !customLon) {
          setError('Please provide valid latitude and longitude coordinates.');
          setLoading(false);
          return;
        }
        payload.latitude = parseFloat(customLat);
        payload.longitude = parseFloat(customLon);
        payload.city_name = customName || 'Custom Location';
      } else {
        payload.city_id = selectedCityId;
      }

      const res = await api.fetchLiveWeather(payload);
      setLiveData(res);
    } catch (err) {
      console.error('Failed to fetch live weather:', err);
      setError(err.response?.data?.detail || err.message || 'Error fetching live weather from Open-Meteo.');
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!liveData) return;
    try {
      setIngesting(true);
      setError(null);
      await api.ingestLiveWeather(liveData);
      setIngestSuccess(`Live observation for ${liveData.observation.location} ingested successfully into dashboard!`);
      if (onDataIngested) {
        onDataIngested();
      }
    } catch (err) {
      console.error('Ingestion failed:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to ingest record.');
    } finally {
      setIngesting(false);
    }
  };

  const handleClear = async () => {
    try {
      setClearing(true);
      setError(null);
      const res = await api.clearLiveRecords();
      setIngestSuccess(`Dataset reset: Cleared ${res.cleared_count} live records. Baseline restored.`);
      setLiveData(null);
      if (onDataIngested) {
        onDataIngested();
      }
    } catch (err) {
      console.error('Failed to clear live records:', err);
      setError(err.response?.data?.detail || 'Failed to reset records.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-navy-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Globe className="w-5 h-5 animate-spin" style={{ animationDuration: '18s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">Live Weather Ingestion</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Open-Meteo Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-300">Fetch real-world weather and test real-time AI anomaly detection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {ingestSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{ingestSuccess}</span>
              </div>
            </div>
          )}

          {/* Location Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                Select Real-World Meteorological Target
              </label>
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold"
              >
                {isCustom ? 'Switch to Preset Cities' : 'Enter Custom GPS Coordinates'}
              </button>
            </div>

            {!isCustom ? (
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium text-slate-800"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.country} ({c.region}) — [{c.latitude}, {c.longitude}]
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">City / Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Munich"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 48.1351"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 11.5820"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleFetch}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Radio className={`w-4 h-4 ${loading ? 'animate-spin' : 'animate-pulse'}`} />
              <span>{loading ? 'Polling Real-Time Atmospheric Feed...' : 'Fetch Current Live Weather'}</span>
            </button>
          </div>

          {/* Live Result Display */}
          {liveData && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Observation</span>
                  <h4 className="text-sm font-bold text-slate-900">{liveData.observation.location}</h4>
                  <span className="text-[11px] text-slate-500 font-mono">{liveData.observation.timestamp} UTC</span>
                </div>
                <MetricBadge status={liveData.status} size="md" />
              </div>

              {/* Measurements Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block font-medium">Temperature</span>
                  <span className="text-base font-extrabold text-slate-800">{liveData.observation.temp}°C</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block font-medium">Humidity</span>
                  <span className="text-base font-extrabold text-slate-800">{liveData.observation.rhum}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block font-medium">Δ Temp (1h)</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {liveData.observation.temp_change > 0 ? `+${liveData.observation.temp_change}` : liveData.observation.temp_change}°C
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block font-medium">Δ Rhum (1h)</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {liveData.observation.humidity_change > 0 ? `+${liveData.observation.humidity_change}` : liveData.observation.humidity_change}%
                  </span>
                </div>
              </div>

              {/* Model Assessment Highlight */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Isolation Forest Score:</span>
                  <span className={`text-lg font-bold font-mono ${liveData.is_anomaly ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {liveData.anomaly_score?.toFixed(6)}
                  </span>
                </div>
                <p className="text-slate-500 text-right max-w-xs text-[11px]">
                  {liveData.confidence_description}
                </p>
              </div>

              {/* Action: Ingest Live Reading */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleIngest}
                  disabled={ingesting}
                  className="w-full sm:flex-1 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{ingesting ? 'Ingesting...' : 'Ingest into Weather Monitoring Table & Charts'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Reset Option */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing}
            className="text-slate-500 hover:text-rose-700 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Dataset to Historical Baseline</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
