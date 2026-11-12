import React, { useState } from 'react';
import { DiagnosisResult } from '../types';
import { Sparkles, Check, Copy, Download, Cpu, Wrench, ShieldCheck, ArrowRight, Layers, FileCode } from 'lucide-react';

interface DiagnosisPanelProps {
  diagnosis: DiagnosisResult | null;
  isAnalyzing: boolean;
  onRunDiagnosis: () => void;
  analysisMode?: string;
  analysisWarning?: string;
}

export const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({
  diagnosis,
  isAnalyzing,
  onRunDiagnosis,
  analysisMode,
  analysisWarning,
}) => {
  const [codeCopied, setCodeCopied] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

  if (isAnalyzing) {
    return (
      <div id="diagnosis-section" className="rounded border border-slate-800/90 bg-[#060910] p-6 lg:p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-4" />
        <h4 className="text-base font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
          Decompiling & Analyzing Crash Stack Trace...
        </h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Correlating timestamps, electrical rail droop, register status codes (CFSR/HFSR), and peripheral timeout state machines with Gemini 3.8 Flash.
        </p>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div id="diagnosis-section" className="rounded border border-dashed border-slate-800 bg-[#060910]/50 p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-3">
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
        <h4 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wide mb-1">
          Root Cause Diagnosis Engine Idle
        </h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
          Click "Run AI Root Cause" in the header or below to initiate deep reasoning across electrical transients, register dumps, and firmware bus state machines.
        </p>
        <button
          onClick={onRunDiagnosis}
          className="px-4 py-2 text-xs font-mono font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded border border-amber-300 transition-colors shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Execute Structured Root-Cause Diagnosis</span>
        </button>
      </div>
    );
  }

  const handleCopyCode = () => {
    if (diagnosis.firmwareFix?.codeSnippet) {
      navigator.clipboard.writeText(diagnosis.firmwareFix.codeSnippet);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleExportMarkdown = () => {
    const md = `# UART Log RootCause Diagnostic Report
Generated: ${diagnosis.analysisTimestamp}
Engine: ${diagnosis.generatedBy}
Confidence: ${diagnosis.confidenceScore}%

## Executive Summary
${diagnosis.executiveSummary}

## Primary Root Cause
${diagnosis.primaryRootCause}

## Chronological Failure Sequence
${diagnosis.failureChain.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Affected Hardware Subsystems
${diagnosis.affectedHardwareSubsystems.map(s => `- ${s}`).join('\n')}

## Recommended Firmware Patch (${diagnosis.firmwareFix.targetDriverOrFile})
\`\`\`${diagnosis.firmwareFix.language}
${diagnosis.firmwareFix.codeSnippet}
\`\`\`
${diagnosis.firmwareFix.explanation}

## Hardware Remediation Checklist
${diagnosis.hardwareFix.map(h => `- [ ] ${h}`).join('\n')}

## Preventative Validation
${diagnosis.preventativeMeasures.map(p => `- ${p}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  return (
    <div id="diagnosis-section" className="rounded border border-slate-800/90 bg-[#060910] overflow-hidden">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 lg:px-6 bg-[#090e18] border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-purple-950/40 border border-purple-800/60 text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
                Structured Root-Cause Diagnosis
              </h3>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-emerald-400 tabular-nums">
                CONFIDENCE: {diagnosis.confidenceScore}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Engine: {diagnosis.generatedBy}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 font-mono text-[11px]">{new Date(diagnosis.analysisTimestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-slate-100 transition-colors"
          >
            {exportCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Markdown Copied!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Report (MD)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {analysisWarning && (
        <div className="px-6 py-2.5 bg-amber-950/30 border-b border-amber-800/50 text-xs font-mono text-amber-300 flex items-center gap-2">
          <span>Notice:</span>
          <span>{analysisWarning}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="p-4 lg:p-6 space-y-6">
        {/* Executive Summary */}
        <div className="p-4 rounded border border-slate-800 bg-[#0a0f1a]">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Executive Technical Summary
          </span>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {diagnosis.executiveSummary}
          </p>
        </div>

        {/* Primary Root Cause Callout */}
        <div className="p-4 rounded border border-amber-500/40 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              Primary Hardware / Register Root Cause
            </span>
          </div>
          <p className="text-sm text-slate-100 font-mono font-medium leading-relaxed">
            {diagnosis.primaryRootCause}
          </p>
        </div>

        {/* 2-Column: Failure Chain & Subsystems */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Failure Chain (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
              Chronological Failure Sequence
            </span>
            <div className="space-y-2">
              {diagnosis.failureChain.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded border border-slate-800/80 bg-[#0b101c]"
                >
                  <span className="w-6 h-6 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-mono text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Subsystems & Hardware Fixes (1 col) */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Affected Subsystems
              </span>
              <div className="space-y-1.5">
                {diagnosis.affectedHardwareSubsystems.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs font-mono text-slate-300 p-2 rounded bg-slate-900/60 border border-slate-800"
                  >
                    <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Hardware / Schematic Remediation
              </span>
              <div className="space-y-2">
                {diagnosis.hardwareFix.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-300 p-2.5 rounded bg-slate-900/60 border border-slate-800"
                  >
                    <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Firmware Fix Code Snippet */}
        {diagnosis.firmwareFix && (
          <div className="rounded border border-slate-800 bg-[#080d16] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1320] border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Recommended Firmware Patch: {diagnosis.firmwareFix.targetDriverOrFile || 'Driver Fix'}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-mono text-cyan-400 uppercase">
                  {diagnosis.firmwareFix.language || 'C'}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-slate-100 transition-colors"
              >
                {codeCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-[#05080f]">
              <pre className="font-mono text-xs text-emerald-300/90 leading-relaxed overflow-x-auto p-2">
                <code>{diagnosis.firmwareFix.codeSnippet}</code>
              </pre>
            </div>

            <div className="px-4 py-3 bg-[#0a0f1a] border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Implementation Rationale: </span>
              {diagnosis.firmwareFix.explanation}
            </div>
          </div>
        )}

        {/* Preventative Measures */}
        {diagnosis.preventativeMeasures && diagnosis.preventativeMeasures.length > 0 && (
          <div className="p-4 rounded border border-slate-800 bg-[#090e18]">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Preventative Firmware Invariants & Regression Guardrails
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
              {diagnosis.preventativeMeasures.map((measure, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono shrink-0">›</span>
                  <span>{measure}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
