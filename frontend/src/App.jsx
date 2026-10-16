import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './pages/Overview';
import WeatherMonitoring from './pages/WeatherMonitoring';
import AnomalyDetection from './pages/AnomalyDetection';
import ModelAnalysis from './pages/ModelAnalysis';
import Reports from './pages/Reports';
import About from './pages/About';
import LiveWeatherModal from './components/LiveWeatherModal';
import api from './services/api';

const pageTitles = {
  '/': {
    title: 'Executive Weather Overview',
    subtitle: 'High-level telemetry, anomaly detection rates, and observational trends',
  },
  '/weather': {
    title: 'Weather Monitoring & History',
    subtitle: 'Searchable, filterable meteorological observations with model assessments',
  },
  '/anomalies': {
    title: 'Anomaly Detection & Diagnostics',
    subtitle: 'Deep-dive inspection of identified atmospheric statistical divergences',
  },
  '/model': {
    title: 'Isolation Forest Model Analysis',
    subtitle: 'Hyperparameters, synthetic benchmarks, score distributions, and real-time predictor',
  },
  '/reports': {
    title: 'Reports & Data Repository',
    subtitle: 'Verified datasets, evaluation logs, and custom CSV exports',
  },
  '/about': {
    title: 'Methodology & Technical Guide',
    subtitle: 'Architecture, engineering details, provenance, and scientific limitations',
  },
};

function LayoutWrapper() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [freshness, setFreshness] = useState('Checking API...');
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  const currentPage = pageTitles[location.pathname] || {
    title: 'WeatherGuard',
    subtitle: 'AI Weather Anomaly Detection System',
  };

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.getHealth();
        setFreshness(`Connected • ${res.records_loaded} records`);
      } catch (e) {
        setFreshness('Offline / Backend Disconnected');
      }
    }
    checkHealth();
  }, [refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleLiveIngested = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          title={currentPage.title}
          subtitle={currentPage.subtitle}
          freshness={freshness}
          onOpenLiveModal={() => setIsLiveModalOpen(true)}
        />

        <LiveWeatherModal
          isOpen={isLiveModalOpen}
          onClose={() => setIsLiveModalOpen(false)}
          onDataIngested={handleLiveIngested}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Overview onRefreshTrigger={refreshKey} />} />
            <Route path="/weather" element={<WeatherMonitoring onRefreshTrigger={refreshKey} />} />
            <Route path="/anomalies" element={<AnomalyDetection onRefreshTrigger={refreshKey} />} />
            <Route path="/model" element={<ModelAnalysis onRefreshTrigger={refreshKey} />} />
            <Route path="/reports" element={<Reports onRefreshTrigger={refreshKey} />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              WeatherGuard © 2024 — Machine Learning Climate Intelligence. Station 02956.
            </p>
            <p className="text-slate-400">
              Isolation Forest (contamination=0.05, n_estimators=200)
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LayoutWrapper />
    </BrowserRouter>
  );
}
