import React, { useState, useMemo, useRef } from 'react';
import { TelemetryDataPoint } from '../types';
import { Activity, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Layers } from 'lucide-react';

interface TelemetryWaveformProps {
  points: TelemetryDataPoint[];
  selectedLine: number | null;
  onSelectLine: (line: number) => void;
  channelAName: string;
  channelBName?: string;
  channelAUnit?: string;
  channelBUnit?: string;
}

export const TelemetryWaveform: React.FC<TelemetryWaveformProps> = ({
  points,
  selectedLine,
  onSelectLine,
  channelAName,
  channelBName,
  channelAUnit = '',
  channelBUnit = '',
}) => {
  const [showChannelA, setShowChannelA] = useState(true);
  const [showChannelB, setShowChannelB] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter visible points based on zoom and pan
  const visiblePoints = useMemo(() => {
    if (points.length === 0) return [];
    if (zoomLevel === 1) return points;
    const windowSize = Math.max(10, Math.floor(points.length / zoomLevel));
    const start = Math.min(Math.max(0, panOffset), points.length - windowSize);
    return points.slice(start, start + windowSize);
  }, [points, zoomLevel, panOffset]);

  // Calculate min/max scales for Channel A and Channel B
  const { minA, maxA, minB, maxB } = useMemo(() => {
    if (points.length === 0) return { minA: 0, maxA: 1, minB: 0, maxB: 1 };
    
    let aMin = Infinity;
    let aMax = -Infinity;
    let bMin = Infinity;
    let bMax = -Infinity;

    points.forEach((p) => {
      if (p.channelA < aMin) aMin = p.channelA;
      if (p.channelA > aMax) aMax = p.channelA;
      if (p.channelB !== undefined) {
        if (p.channelB < bMin) bMin = p.channelB;
        if (p.channelB > bMax) bMax = p.channelB;
      }
    });

    // Add 10% padding
    const padA = (aMax - aMin) * 0.1 || 0.5;
    const padB = (bMax - bMin) * 0.1 || 1;

    return {
      minA: aMin - padA,
      maxA: aMax + padA,
      minB: bMin === Infinity ? 0 : bMin - padB,
      maxB: bMax === -Infinity ? 1 : bMax + padB,
    };
  }, [points]);

  // SVG dimensions
  const svgWidth = 1000;
  const svgHeight = 220;
  const padLeft = 55;
  const padRight = 55;
  const padTop = 20;
  const padBottom = 35;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Coordinate mapping functions
  const getX = (idx: number, total: number) => {
    if (total <= 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (total - 1)) * plotWidth;
  };

  const getYA = (val: number) => {
    if (maxA === minA) return padTop + plotHeight / 2;
    const norm = (val - minA) / (maxA - minA);
    return padTop + plotHeight - norm * plotHeight;
  };

  const getYB = (val: number) => {
    if (maxB === minB) return padTop + plotHeight / 2;
    const norm = (val - minB) / (maxB - minB);
    return padTop + plotHeight - norm * plotHeight;
  };

  // Generate SVG path strings
  const pathA = useMemo(() => {
    if (visiblePoints.length === 0) return '';
    return visiblePoints.reduce((acc, p, i) => {
      const x = getX(i, visiblePoints.length);
      const y = getYA(p.channelA);
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [visiblePoints, minA, maxA]);

  const pathB = useMemo(() => {
    if (visiblePoints.length === 0 || !channelBName) return '';
    return visiblePoints.reduce((acc, p, i) => {
      if (p.channelB === undefined) return acc;
      const x = getX(i, visiblePoints.length);
      const y = getYB(p.channelB);
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [visiblePoints, minB, maxB, channelBName]);

  // Fill gradient path under Channel A
  const fillPathA = useMemo(() => {
    if (!pathA || visiblePoints.length === 0) return '';
    const firstX = getX(0, visiblePoints.length);
    const lastX = getX(visiblePoints.length - 1, visiblePoints.length);
    const bottomY = padTop + plotHeight;
    return `${pathA} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathA, visiblePoints.length]);

  const activePoint = hoverIndex !== null && visiblePoints[hoverIndex] 
    ? visiblePoints[hoverIndex] 
    : (selectedLine ? visiblePoints.find(p => p.line === selectedLine) : null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || visiblePoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relativeX = (mouseX / rect.width) * svgWidth;
    
    if (relativeX < padLeft || relativeX > svgWidth - padRight) {
      setHoverIndex(null);
      return;
    }

    const ratio = (relativeX - padLeft) / plotWidth;
    const index = Math.round(ratio * (visiblePoints.length - 1));
    const clamped = Math.max(0, Math.min(visiblePoints.length - 1, index));
    setHoverIndex(clamped);
  };

  const handleClick = () => {
    if (activePoint) {
      onSelectLine(activePoint.line);
    }
  };

  return (
    <div id="waveform-studio" className="border-b border-slate-800/80 bg-[#070b12] p-4 lg:p-6" ref={containerRef}>
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-cyan-950/40 border border-cyan-800/60 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
                Synchronized Telemetry Waveform Studio
              </h3>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-cyan-400">
                {visiblePoints.length} SAMPLES PLOTTED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive dual-channel oscilloscope trace correlated with raw UART log line numbers
            </p>
          </div>
        </div>

        {/* Channel toggles and zoom */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setShowChannelA(!showChannelA)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              showChannelA
                ? 'border-amber-500/60 bg-amber-950/40 text-amber-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span>{channelAName}</span>
          </button>

          {channelBName && (
            <button
              onClick={() => setShowChannelB(!showChannelB)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                showChannelB
                  ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-900/60 text-slate-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              <span>{channelBName}</span>
            </button>
          )}

          <div className="flex items-center rounded border border-slate-800 bg-slate-900/60 overflow-hidden">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev * 1.5, 8))}
              title="Zoom In Waveform"
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev / 1.5, 1))}
              title="Zoom Out Waveform"
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                onClick={() => { setZoomLevel(1); setPanOffset(0); }}
                title="Reset Zoom"
                className="p-1 hover:bg-slate-800 text-amber-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main SVG Scope Canvas */}
      <div className="relative rounded border border-slate-800/90 bg-[#060910] overflow-hidden group">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 cursor-crosshair select-none relative z-10"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="gradientA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradientB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal division lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padTop + ratio * plotHeight;
            const valA = maxA - ratio * (maxA - minA);
            const valB = maxB - ratio * (maxB - minB);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray={ratio === 0.5 ? '4 4' : '2 4'}
                />
                {/* Left Axis: Channel A */}
                {showChannelA && (
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {valA.toFixed(valA < 10 && valA > -10 ? 2 : 0)}{channelAUnit}
                  </text>
                )}
                {/* Right Axis: Channel B */}
                {showChannelB && channelBName && (
                  <text
                    x={svgWidth - padRight + 8}
                    y={y + 3}
                    textAnchor="start"
                    fill="#06b6d4"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {valB.toFixed(0)}{channelBUnit}
                  </text>
                )}
              </g>
            );
          })}

          {/* Channel A Shaded Area */}
          {showChannelA && fillPathA && (
            <path d={fillPathA} fill="url(#gradientA)" />
          )}

          {/* Channel A Waveform Line */}
          {showChannelA && pathA && (
            <path
              d={pathA}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Channel B Waveform Line */}
          {showChannelB && pathB && (
            <path
              d={pathB}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="4 2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Anomaly Event Markers along timeline */}
          {visiblePoints.map((p, i) => {
            if (!p.isAnomaly) return null;
            const x = getX(i, visiblePoints.length);
            const y = getYA(p.channelA);
            const isCritical = p.anomalySummary?.includes('Brownout') || p.anomalySummary?.includes('HardFault') || p.anomalySummary?.includes('clipped');
            return (
              <g key={`marker-${p.line}`} className="cursor-pointer">
                {/* Vertical Alert Beam */}
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotHeight}
                  stroke={isCritical ? '#f43f5e' : '#f59e0b'}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.75"
                />
                {/* Marker Diamond Pin */}
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill={isCritical ? '#f43f5e' : '#f59e0b'}
                  stroke="#060910"
                  strokeWidth="1.5"
                  className="animate-pulse"
                />
              </g>
            );
          })}

          {/* Active / Hover Crosshair Tracking Line */}
          {activePoint && (
            <g>
              {(() => {
                const activeIndex = visiblePoints.findIndex(p => p.line === activePoint.line);
                if (activeIndex === -1) return null;
                const x = getX(activeIndex, visiblePoints.length);
                const yA = getYA(activePoint.channelA);
                return (
                  <>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + plotHeight}
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={x}
                      cy={yA}
                      r="6"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {/* Timestamp label at bottom */}
                    <text
                      x={x}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      fill="#10b981"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {activePoint.timestamp} (Line {activePoint.line})
                    </text>
                  </>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Live HUD Tooltip Bar */}
        <div className="px-4 py-2 bg-[#090d16] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">LINE:</span>
              <span className="text-emerald-400 font-bold tabular-nums">
                {activePoint ? `#${activePoint.line}` : 'Hover cursor'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">TIMESTAMP:</span>
              <span className="text-slate-200 tabular-nums">
                {activePoint ? activePoint.timestamp : '--'}
              </span>
            </div>

            {showChannelA && (
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">{channelAName}:</span>
                <span className="text-slate-200 font-bold tabular-nums">
                  {activePoint ? `${activePoint.channelA} ${channelAUnit}` : '--'}
                </span>
              </div>
            )}

            {showChannelB && channelBName && (
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400">{channelBName}:</span>
                <span className="text-slate-200 font-bold tabular-nums">
                  {activePoint && activePoint.channelB !== undefined ? `${activePoint.channelB} ${channelBUnit}` : '--'}
                </span>
              </div>
            )}
          </div>

          {activePoint?.isAnomaly && (
            <div className="flex items-center gap-1.5 text-rose-400 font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{activePoint.anomalySummary || 'Hardware Fault Detected'}</span>
            </div>
          )}

          <div className="text-[11px] text-slate-500">
            Click waveform to jump to raw serial log line
          </div>
        </div>
      </div>
    </div>
  );
};
