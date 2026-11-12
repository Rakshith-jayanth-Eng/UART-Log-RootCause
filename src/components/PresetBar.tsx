import React from 'react';
import { SAMPLE_PRESETS } from '../data/presets';
import { Radio, Cpu, Plane, FileText, CheckCircle2 } from 'lucide-react';
import { SamplePreset } from '../types';

interface PresetBarProps {
  selectedPresetId: string | null;
  onSelectPreset: (preset: SamplePreset) => void;
  onSelectCustom: () => void;
  isCustom: boolean;
}

export const PresetBar: React.FC<PresetBarProps> = ({
  selectedPresetId,
  onSelectPreset,
  onSelectCustom,
  isCustom,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Radio':
        return <Radio className="w-4 h-4 text-amber-400" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'Plane':
        return <Plane className="w-4 h-4 text-cyan-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="border-b border-slate-800/80 bg-[#080c14] px-6 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-300">
            LOAD SIMULATION PRESET
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">
            One-click reproducible hardware fault logs
          </span>
        </div>
        <button
          onClick={onSelectCustom}
          className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors self-start sm:self-auto ${
            isCustom
              ? 'border-purple-500/50 bg-purple-950/40 text-purple-300'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isCustom ? '✓ Custom Input Active' : 'Paste Custom Raw Log'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SAMPLE_PRESETS.map((preset) => {
          const isSelected = !isCustom && selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-3 rounded border transition-all relative group ${
                isSelected
                  ? 'border-amber-500/60 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'border-slate-800/90 bg-[#0d131f] hover:border-slate-700 hover:bg-[#101726]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-900 border border-slate-800">
                    {getIcon(preset.iconName)}
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-200 group-hover:text-amber-300 transition-colors">
                    {preset.name}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-400 mb-1.5 line-clamp-1">
                {preset.device}
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
