import React, { useRef } from 'react';
import { Upload, FileText, Trash2, RefreshCw } from 'lucide-react';

interface LogInputPanelProps {
  rawText: string;
  onChangeText: (text: string) => void;
  format: string;
  totalLines: number;
  onClear: () => void;
}

export const LogInputPanel: React.FC<LogInputPanelProps> = ({
  rawText,
  onChangeText,
  format,
  totalLines,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="border-b border-slate-800/80 bg-[#090d16] p-4 lg:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
            Serial / Telemetry Raw Ingestion
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-mono text-cyan-400 uppercase">
            Detected: {format}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {totalLines} lines ({rawText.length.toLocaleString()} chars)
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".log,.txt,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File (.log/.csv)</span>
          </button>
          {rawText.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative rounded border border-slate-800/90 bg-[#060910] overflow-hidden"
      >
        <textarea
          value={rawText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Paste raw serial UART logs, microcontroller terminal dumps, PX4 sensor CSV telemetry, or ARM Cortex-M HardFault register traces here..."
          className="w-full h-36 p-3 text-xs font-mono text-slate-200 bg-transparent resize-y focus:outline-hidden placeholder:text-slate-600 leading-relaxed"
        />
        <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-600 pointer-events-none">
          Drag & drop files directly or paste stream
        </div>
      </div>
    </div>
  );
};
