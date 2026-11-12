import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, Copy, Check, Terminal, Filter } from 'lucide-react';
import { SeverityLevel } from '../types';

interface LogGutterProps {
  rawText: string;
  selectedLine: number | null;
  onSelectLine: (line: number) => void;
}

export const LogGutter: React.FC<LogGutterProps> = ({
  rawText,
  selectedLine,
  onSelectLine,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const lines = rawText.split(/\r?\n/);

  // Scroll active line into view when selectedLine changes
  useEffect(() => {
    if (selectedLine !== null && activeLineRef.current && logContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedLine]);

  // Copy raw text to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Search matches
  const matchingLineIndices = lines
    .map((line, idx) => (searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase()) ? idx + 1 : -1))
    .filter(idx => idx !== -1);

  const handleNextMatch = () => {
    if (matchingLineIndices.length === 0) return;
    const next = matchingLineIndices.find(idx => (selectedLine ? idx > selectedLine : true)) || matchingLineIndices[0];
    onSelectLine(next);
  };

  const handlePrevMatch = () => {
    if (matchingLineIndices.length === 0) return;
    const reversed = [...matchingLineIndices].reverse();
    const prev = reversed.find(idx => (selectedLine ? idx < selectedLine : true)) || reversed[0];
    onSelectLine(prev);
  };

  // Format and highlight line contents
  const renderHighlightedLine = (text: string) => {
    // Detect severity tag
    const isCrit = /\[CRIT\]|HARDFAULT|Brownout detector|RTCWDT_RTC_RESET/i.test(text);
    const isErr = /\[ERROR\]|\[ERR\]|timeout|lost in TX/i.test(text);
    const isWarn = /\[WARN\]|droop|dip|warning/i.test(text);
    const isBoot = /\[BOOT\]|\[INIT\]/i.test(text);

    let textColor = 'text-slate-300';
    if (isCrit) textColor = 'text-rose-400 font-bold';
    else if (isErr) textColor = 'text-amber-400';
    else if (isWarn) textColor = 'text-yellow-300';
    else if (isBoot) textColor = 'text-emerald-400';

    // If search active, highlight matched substring
    if (searchQuery && text.toLowerCase().includes(searchQuery.toLowerCase())) {
      const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
      return (
        <span className={textColor}>
          {parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark key={i} className="bg-amber-400 text-slate-950 px-0.5 rounded-xs font-semibold">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      );
    }

    return <span className={textColor}>{text}</span>;
  };

  return (
    <div id="log-gutter" className="flex flex-col h-full bg-[#060910] border border-slate-800/90 rounded overflow-hidden">
      {/* Gutter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0a0e18] border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
            Raw Monospace Serial Gutter
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {lines.length} lines
          </span>
        </div>

        {/* Search & Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search register, timeout, error..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-16 py-1 text-xs font-mono rounded bg-slate-900 border border-slate-700/80 text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500/80 w-56"
            />
            {matchingLineIndices.length > 0 && (
              <span className="absolute right-2 text-[10px] font-mono text-amber-400">
                {matchingLineIndices.length} found
              </span>
            )}
          </div>

          {matchingLineIndices.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMatch}
                title="Previous Match"
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextMatch}
                title="Next Match"
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-slate-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Logs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Terminal Scroll Area */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs leading-relaxed select-text"
        style={{ maxHeight: '420px', minHeight: '320px' }}
      >
        {lines.map((line, idx) => {
          const lineNumber = idx + 1;
          const isSelected = selectedLine === lineNumber;

          return (
            <div
              key={idx}
              ref={isSelected ? activeLineRef : undefined}
              onClick={() => onSelectLine(lineNumber)}
              className={`flex items-start gap-3 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-amber-950/40 border border-amber-500/50 text-slate-100 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'hover:bg-slate-900/50'
              }`}
            >
              {/* Line Number */}
              <span className="w-10 text-right shrink-0 select-none text-slate-600 font-mono text-[11px] tabular-nums pt-0.5">
                {lineNumber}
              </span>

              {/* Line Text with highlights */}
              <div className="flex-1 whitespace-pre-wrap break-all font-mono">
                {renderHighlightedLine(line)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
