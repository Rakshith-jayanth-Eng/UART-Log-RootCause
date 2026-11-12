export type SeverityLevel = 'critical' | 'error' | 'warning' | 'info' | 'debug';

export type AnomalyType = 
  | 'brownout'
  | 'watchdog_reset'
  | 'spi_timeout'
  | 'i2c_bus_lock'
  | 'packet_drop'
  | 'sensor_saturation'
  | 'hardfault'
  | 'stack_overflow'
  | 'crc_mismatch'
  | 'buffer_overrun';

export interface AnomalyEvent {
  id: string;
  line: number;
  timestamp: string;
  timestampMs?: number;
  type: AnomalyType;
  severity: SeverityLevel;
  subsystem: string;
  metricName?: string;
  metricValue?: number | string;
  summary: string;
  rawText: string;
}

export interface TelemetryDataPoint {
  index: number;
  line: number;
  timestamp: string;
  timestampMs: number;
  channelA: number; // Primary metric e.g. VDD (V), GyroX (deg/s), Accel (m/s2)
  channelB?: number; // Secondary metric e.g. RSSI (dBm), Bus Latency (ms), Packet drops
  channelAName: string;
  channelBName?: string;
  channelAUnit?: string;
  channelBUnit?: string;
  isAnomaly?: boolean;
  anomalyId?: string;
  anomalySummary?: string;
}

export interface ParsedLogResult {
  format: 'serial' | 'csv' | 'stacktrace' | 'generic';
  totalLines: number;
  detectedMetrics: {
    channelA: string;
    channelB?: string;
    unitA: string;
    unitB?: string;
  };
  telemetryPoints: TelemetryDataPoint[];
  anomalies: AnomalyEvent[];
  stats: {
    criticalCount: number;
    errorCount: number;
    warningCount: number;
    packetLossDetected: boolean;
    resetsDetected: number;
    timeoutsDetected: number;
  };
}

export interface FirmwareRemediation {
  explanation: string;
  codeSnippet: string;
  language: string;
  targetDriverOrFile: string;
}

export interface DiagnosisResult {
  executiveSummary: string;
  primaryRootCause: string;
  confidenceScore: number; // 0 - 100
  failureChain: string[];
  affectedHardwareSubsystems: string[];
  identifiedAnomalies: {
    timestamp: string;
    event: string;
    impact: string;
  }[];
  firmwareFix: FirmwareRemediation;
  hardwareFix: string[];
  preventativeMeasures: string[];
  generatedBy: string;
  analysisTimestamp: string;
}

export interface SamplePreset {
  id: string;
  name: string;
  device: string;
  iconName: string;
  category: 'IoT / Wireless' | 'Automotive / Embedded' | 'Robotics / Flight';
  description: string;
  expectedRootCause: string;
  content: string;
}
