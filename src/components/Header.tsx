import React from 'react';
import { Terminal, Activity, Zap, Monitor, Volume2, VolumeX, Sparkles, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRunDiagnosis: () => void;
  isAnalyzing: boolean;
  anomalyCount: number;
  criticalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  scanlinesEnabled,
  onToggleScanlines,
  soundEnabled,
  onToggleSound,
  onRunDiagnosis,
  isAnalyzing,
  anomalyCount,
  criticalCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded border border-emerald-500/40 bg-emerald-950/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <Terminal className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <a href="/" className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap font-mono hover:text-emerald-400 transition-colors">
            UART LOG ROOTCAUSE
          </a>
          <span className="text-[11px] font-mono text-slate-400 tracking-wider">
            SERIAL & TELEMETRY ANOMALY ANALYZER
          </span>
        </div>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-mono text-slate-400">
        <a href="#waveform-studio" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Waveform Studio</span>
        </a>
        <a href="#anomaly-matrix" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Anomaly Matrix</span>
          {anomalyCount > 0 && (
            <span className="text-[10px] text-amber-400 font-mono">({anomalyCount})</span>
          )}
        </a>
        <a href="#log-gutter" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Log Stream</span>
        </a>
        <a href="#diagnosis-section" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>Root Cause Report</span>
        </a>
      </nav>

      {/* Zone 3: 1 primary action with secondary tactile switches */}
      <div className="flex items-center gap-3 shrink-0">
        {/* CRT Scanline Toggle */}
        <button
          onClick={onToggleScanlines}
          title="Toggle CRT Scanline Effect"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            scanlinesEnabled
              ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CRT: {scanlinesEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Audio click feedback toggle */}
        <button
          onClick={onToggleSound}
          title="Toggle Click Audio Feedback"
          className={`p-1.5 text-xs font-mono rounded border transition-colors ${
            soundEnabled
              ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
              : 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onRunDiagnosis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded border border-amber-300 transition-colors whitespace-nowrap shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Diagnosing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run AI Root Cause</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
