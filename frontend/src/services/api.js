import axios from 'axios';

// During development, Vite proxy redirects /api to http://127.0.0.1:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health
  getHealth: async () => {
    const res = await client.get('/api/health');
    return res.data;
  },

  // Summary
  getSummary: async (params = {}) => {
    const res = await client.get('/api/summary', { params });
    return res.data;
  },

  // Weather records
  getWeather: async (params = {}) => {
    const res = await client.get('/api/weather', { params });
    return res.data;
  },

  // CSV Export URL builder
  getWeatherExportUrl: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    return `${API_BASE_URL}/api/weather/export?${query.toString()}`;
  },

  // Anomalies
  getAnomalies: async (params = {}) => {
    const res = await client.get('/api/anomalies', { params });
    return res.data;
  },

  // Analytics
  getAnalytics: async () => {
    const res = await client.get('/api/analytics');
    return res.data;
  },

  // Model Info
  getModelInfo: async () => {
    const res = await client.get('/api/model-info');
    return res.data;
  },

  // Evaluation
  getEvaluation: async () => {
    const res = await client.get('/api/evaluation');
    return res.data;
  },

  // Real-time inference
  predict: async (data) => {
    const res = await client.post('/api/predict', data);
    return res.data;
  },

  // Reports
  getReports: async () => {
    const res = await client.get('/api/reports');
    return res.data;
  },

  // Report download link
  getReportDownloadUrl: (filename) => {
    return `${API_BASE_URL}/api/reports/${encodeURIComponent(filename)}/download`;
  },

  // Live Real-World Weather (Open-Meteo Integration)
  getPresetCities: async () => {
    const res = await client.get('/api/live/cities');
    return res.data;
  },

  getStationsMap: async () => {
    const res = await client.get('/api/live/stations-map');
    return res.data;
  },

  fetchLiveWeather: async (payload) => {
    const res = await client.post('/api/live/fetch', payload);
    return res.data;
  },

  ingestLiveWeather: async (payload) => {
    const res = await client.post('/api/live/ingest', payload);
    return res.data;
  },

  clearLiveRecords: async () => {
    const res = await client.post('/api/live/clear');
    return res.data;
  },
};

export default api;
