import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CloudRain,
  AlertTriangle,
  Cpu,
  FileText,
  Info,
  ShieldCheck,
  Activity,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Weather Monitoring', href: '/weather', icon: CloudRain },
  { name: 'Anomaly Detection', href: '/anomalies', icon: AlertTriangle },
  { name: 'Model Analysis', href: '/model', icon: Cpu },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'About / Methodology', href: '/about', icon: Info },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo and Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Weather<span className="text-cyan-400 font-extrabold">Guard</span>
              </span>
              <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">AI Climate Anomaly System</p>
            </div>
          </div>
        </div>

        {/* Station Metadata Chip */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-lg bg-navy-800/80 border border-slate-700/60 text-xs text-slate-300">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 font-medium">Station ID</span>
            <span className="font-mono font-semibold text-cyan-300">02956</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Model Pipeline</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              iForest-05
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Core System Online</p>
              <p className="text-[11px] text-slate-400 truncate">FastAPI + Scikit-Learn</p>
            </div>
            <Activity className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
