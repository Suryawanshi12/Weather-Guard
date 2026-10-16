import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  HardDrive,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);

  // Custom export builder
  const [exportStatus, setExportStatus] = useState('all');
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getReports();
        setReports(res.reports || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
        setError(err.response?.data?.detail || err.message || 'Error fetching report repository.');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const customExportUrl = api.getWeatherExportUrl({
    status: exportStatus !== 'all' ? exportStatus : undefined,
    start_date: exportStart || undefined,
    end_date: exportEnd || undefined,
  });

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}

      {/* Header Info */}
      <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Verified Reports & Data Artifacts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically verified CSV predictions, training splits, and evaluation logs from WeatherGuard experiments.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <HardDrive className="w-4 h-4 text-cyan-600" />
          <span>Local Artifact Storage: <span className="font-mono font-semibold text-slate-700">/reports</span></span>
        </div>
      </div>

      {/* Reports Grid / Table */}
      {loading ? (
        <LoadingSpinner text="Indexing downloadable reports..." />
      ) : reports.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          No reports currently available.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Report Document</th>
                  <th className="px-4 py-3.5">Format</th>
                  <th className="px-4 py-3.5">File Size</th>
                  <th className="px-4 py-3.5">Last Modified</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report, idx) => {
                  const isCsv = report.filename.endsWith('.csv');
                  return (
                    <tr key={idx} className="hover:bg-slate-50/90 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg mt-0.5 ${isCsv ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-700'}`}>
                            {isCsv ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{report.display_name}</span>
                            <span className="text-xs text-slate-500 leading-snug block mt-0.5 max-w-lg">
                              {report.description}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 block mt-1">
                              {report.filename}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {report.file_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600">
                        {formatFileSize(report.size_bytes)}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {report.modified_time}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={api.getReportDownloadUrl(report.filename)}
                          download={report.filename}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Data Export Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Filter className="w-5 h-5 text-cyan-600" />
          <h3 className="text-base font-bold tracking-tight">Generate Custom Filtered Weather CSV</h3>
        </div>
        <p className="text-xs text-slate-500">
          Build a tailored CSV export containing custom date windows and status filters directly from the backend.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Status Filter</label>
            <select
              value={exportStatus}
              onChange={(e) => setExportStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
            >
              <option value="all">All Records</option>
              <option value="Normal">Normal Only</option>
              <option value="Potential Anomaly">Potential Anomalies Only</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Start Date</label>
            <input
              type="date"
              value={exportStart}
              onChange={(e) => setExportStart(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">End Date</label>
            <input
              type="date"
              value={exportEnd}
              onChange={(e) => setExportEnd(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
            />
          </div>
        </div>

        <div className="pt-2">
          <a
            href={customExportUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Tailored CSV Dataset</span>
          </a>
        </div>
      </div>
    </div>
  );
}
