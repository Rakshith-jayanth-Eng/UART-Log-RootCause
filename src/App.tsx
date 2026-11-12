/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SAMPLE_PRESETS } from './data/presets';
import { parseRawLog } from './utils/logParser';
import { AnomalyEvent, DiagnosisResult, SamplePreset } from './types';
import { Header } from './components/Header';
import { PresetBar } from './components/PresetBar';
import { LogInputPanel } from './components/LogInputPanel';
import { TelemetryWaveform } from './components/TelemetryWaveform';
import { AnomalySummaryTable } from './components/AnomalySummaryTable';
import { LogGutter } from './components/LogGutter';
import { DiagnosisPanel } from './components/DiagnosisPanel';
import { Terminal, Shield, Cpu, Activity, Sparkles, HelpCircle } from 'lucide-react';

export default function App() {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('esp32-lora-brownout');
  const [isCustom, setIsCustom] = useState(false);
  const [showInputPanel, setShowInputPanel] = useState(false);
  const [rawText, setRawText] = useState<string>(SAMPLE_PRESETS[0].content);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  
  // Visual & Audio Toggles
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Diagnosis State
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<string>('gemini_ai');
  const [analysisWarning, setAnalysisWarning] = useState<string>('');

  // Audio Click Feedback via Web Audio API
  const playClickSound = useCallback((frequency = 800, duration = 0.03) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext suppressed or not allowed
    }
  }, [soundEnabled]);

  // Parse raw log heuristics
  const parsedResult = useMemo(() => {
    return parseRawLog(rawText);
  }, [rawText]);

  // Trigger server-side Gemini diagnosis
  const handleRunDiagnosis = async () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    setAnalysisWarning('');
    playClickSound(1200, 0.08);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logText: rawText,
          logType: parsedResult.format,
          detectedAnomalies: parsedResult.anomalies,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setDiagnosis(data.diagnosis);
      setAnalysisMode(data.mode || 'gemini_ai');
      if (data.warning) {
        setAnalysisWarning(data.warning);
      }
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      setAnalysisWarning(`Error communicating with /api/analyze: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
      playClickSound(1000, 0.05);
    }
  };

  // Run diagnosis automatically when switching presets
  useEffect(() => {
    handleRunDiagnosis();
  }, [selectedPresetId]);

  // Preset Selection
  const handleSelectPreset = (preset: SamplePreset) => {
    setSelectedPresetId(preset.id);
    setIsCustom(false);
    setShowInputPanel(false);
    setRawText(preset.content);
    setSelectedLine(null);
    playClickSound(950, 0.04);
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
    setShowInputPanel(true);
    setSelectedPresetId(null);
    playClickSound(650, 0.04);
  };

  const handleSelectLine = (line: number) => {
    setSelectedLine(line);
    playClickSound(1100, 0.02);
  };

  const handleSelectAnomaly = (anomaly: AnomalyEvent) => {
    setSelectedLine(anomaly.line);
    playClickSound(1400, 0.04);
  };

  return (
    <div className={`min-h-screen bg-[#070a10] text-slate-100 flex flex-col relative font-sans ${scanlinesEnabled ? 'crt-scanlines crt-vignette' : ''}`}>
      {/* Top Bar */}
      <Header
        scanlinesEnabled={scanlinesEnabled}
        onToggleScanlines={() => {
          setScanlinesEnabled(!scanlinesEnabled);
          playClickSound(700, 0.03);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          setSoundEnabled(!soundEnabled);
          playClickSound(900, 0.03);
        }}
        onRunDiagnosis={handleRunDiagnosis}
        isAnalyzing={isAnalyzing}
        anomalyCount={parsedResult.anomalies.length}
        criticalCount={parsedResult.stats.criticalCount}
      />

      {/* Preset Selection Strip */}
      <PresetBar
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onSelectCustom={handleSelectCustom}
        isCustom={isCustom}
      />

      {/* Custom Raw Log Ingestion Box (Collapsible / Active on Custom) */}
      {(showInputPanel || isCustom) && (
        <LogInputPanel
          rawText={rawText}
          onChangeText={(newText) => {
            setRawText(newText);
            setIsCustom(true);
            setSelectedPresetId(null);
          }}
          format={parsedResult.format}
          totalLines={parsedResult.totalLines}
          onClear={() => {
            setRawText('');
            setSelectedLine(null);
            setDiagnosis(null);
          }}
        />
      )}

      {/* Synchronized Telemetry Waveform Studio */}
      <TelemetryWaveform
        points={parsedResult.telemetryPoints}
        selectedLine={selectedLine}
        onSelectLine={handleSelectLine}
        channelAName={parsedResult.detectedMetrics.channelA}
        channelBName={parsedResult.detectedMetrics.channelB}
        channelAUnit={parsedResult.detectedMetrics.unitA}
        channelBUnit={parsedResult.detectedMetrics.unitB}
      />

      {/* Main Dual Workspace: Raw Log Gutter (Left) & AI Root Cause Diagnosis (Right) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:p-6 bg-[#080c14]">
        {/* Left Pane: Monospace Log Gutter */}
        <div className="flex flex-col h-full min-h-[460px]">
          <LogGutter
            rawText={rawText}
            selectedLine={selectedLine}
            onSelectLine={handleSelectLine}
          />
        </div>

        {/* Right Pane: Structured Root-Cause Diagnosis */}
        <div className="flex flex-col h-full min-h-[460px]">
          <DiagnosisPanel
            diagnosis={diagnosis}
            isAnalyzing={isAnalyzing}
            onRunDiagnosis={handleRunDiagnosis}
            analysisMode={analysisMode}
            analysisWarning={analysisWarning}
          />
        </div>
      </main>

      {/* Full-Width Anomaly Summary Matrix */}
      <section className="bg-[#080c14]">
        <AnomalySummaryTable
          anomalies={parsedResult.anomalies}
          selectedLine={selectedLine}
          onSelectAnomaly={handleSelectAnomaly}
        />
      </section>

      {/* Quiet Technical Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060910] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">UART Log RootCause</span>
          <span className="text-slate-700">·</span>
          <span>gemini-3.8-flash server engine</span>
          <span className="text-slate-700">·</span>
          <span className="text-emerald-400 font-bold">● ONLINE</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Port 3000 Full-Stack</span>
          <span className="text-slate-700">·</span>
          <span>Zero Pill Clean Typography</span>
          <span className="text-slate-700">·</span>
          <a
            href="#diagnosis-section"
            className="hover:text-amber-400 transition-colors underline underline-offset-2"
          >
            Review Diagnosis
          </a>
        </div>
      </footer>
    </div>
  );
}
