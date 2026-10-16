import React from 'react';
import { Menu, RefreshCw, Calendar, Radio } from 'lucide-react';

export default function Header({
  onMenuClick,
  onRefresh,
  isRefreshing,
  title,
  subtitle,
  freshness,
  onOpenLiveModal,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Data freshness, Live Weather Trigger, and Refresh */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenLiveModal && (
            <button
              type="button"
              onClick={onOpenLiveModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg shadow-sm shadow-cyan-600/20 transition-all"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-200" />
              <span>Fetch Live Weather</span>
            </button>
          )}

          {freshness && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{freshness}</span>
            </div>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
