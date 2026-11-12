import React, { useState } from 'react';
import { AnomalyEvent, SeverityLevel } from '../types';
import { AlertCircle, AlertTriangle, Info, ArrowUpRight, Filter } from 'lucide-react';
import { getSeverityStyle } from '../utils/logParser';

interface AnomalySummaryTableProps {
  anomalies: AnomalyEvent[];
  selectedLine: number | null;
  onSelectAnomaly: (anomaly: AnomalyEvent) => void;
}

export const AnomalySummaryTable: React.FC<AnomalySummaryTableProps> = ({
  anomalies,
  selectedLine,
  onSelectAnomaly,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'error' | 'warning'>('all');

  const filtered = anomalies.filter((a) => {
    if (severityFilter === 'all') return true;
    return a.severity === severityFilter;
  });

  const getSeverityIcon = (sev: SeverityLevel) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div id="anomaly-matrix" className="border-b border-slate-800/80 bg-[#090d16] p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
              Hardware & Firmware Anomaly Matrix
            </h3>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-amber-400 tabular-nums">
              {anomalies.length} DISCRETE EVENTS
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Detected packet drops, brownout restarts, SPI timeouts, and sensor saturation events
          </p>
        </div>

        {/* Severity Filter segment buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded border border-slate-800 self-start sm:self-auto">
          {(['all', 'critical', 'error', 'warning'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 text-xs font-mono rounded capitalize transition-colors ${
                severityFilter === sev
                  ? 'bg-slate-800 text-slate-100 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded border border-slate-800/90 bg-[#060910] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b101c] text-slate-400 border-b border-slate-800/80 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Line #</th>
                <th className="py-2.5 px-3">Subsystem</th>
                <th className="py-2.5 px-3">Anomaly Type</th>
                <th className="py-2.5 px-3">Metric Value</th>
                <th className="py-2.5 px-4">Technical Summary</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No anomalies found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((anomaly) => {
                  const isSelected = selectedLine === anomaly.line;
                  const sevStyle = getSeverityStyle(anomaly.severity);

                  return (
                    <tr
                      key={anomaly.id}
                      onClick={() => onSelectAnomaly(anomaly)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-950/30 border-l-2 border-l-amber-400'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Severity (clean unboxed text) */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getSeverityIcon(anomaly.severity)}
                          <span className={`uppercase font-bold text-[11px] ${sevStyle.text}`}>
                            {anomaly.severity}
                          </span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-2 px-3 text-cyan-300 font-mono whitespace-nowrap tabular-nums">
                        {anomaly.timestamp}
                      </td>

                      {/* Line Number */}
                      <td className="py-2 px-3 text-slate-300 font-mono whitespace-nowrap tabular-nums">
                        #{anomaly.line}
                      </td>

                      {/* Subsystem */}
                      <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                        {anomaly.subsystem}
                      </td>

                      {/* Anomaly Type */}
                      <td className="py-2 px-3 text-amber-300 font-medium whitespace-nowrap">
                        {anomaly.type.replace('_', ' ').toUpperCase()}
                      </td>

                      {/* Metric Value */}
                      <td className="py-2 px-3 text-emerald-400 font-mono whitespace-nowrap tabular-nums">
                        {anomaly.metricValue || '—'}
                      </td>

                      {/* Summary */}
                      <td className="py-2 px-4 text-slate-300 font-sans text-xs max-w-md truncate">
                        {anomaly.summary}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAnomaly(anomaly);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
                        >
                          <span>Jump</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
