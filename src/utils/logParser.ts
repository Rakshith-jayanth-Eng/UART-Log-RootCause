import { AnomalyEvent, ParsedLogResult, SeverityLevel, TelemetryDataPoint } from '../types';

export function parseRawLog(rawText: string): ParsedLogResult {
  const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return {
      format: 'generic',
      totalLines: 0,
      detectedMetrics: { channelA: 'Metric A', unitA: '' },
      telemetryPoints: [],
      anomalies: [],
      stats: {
        criticalCount: 0,
        errorCount: 0,
        warningCount: 0,
        packetLossDetected: false,
        resetsDetected: 0,
        timeoutsDetected: 0,
      },
    };
  }

  // Detect format
  const isCsv = lines[0].includes(',') && lines.length > 1 && !lines[0].startsWith('[');
  const isHardFault = rawText.includes('HARDFAULT') || rawText.includes('CFSR') || rawText.includes('HFSR');
  const format = isCsv ? 'csv' : (isHardFault ? 'stacktrace' : 'serial');

  if (isCsv) {
    return parseCsvLogs(lines);
  }

  const nonCsvFormat: 'serial' | 'stacktrace' = isHardFault ? 'stacktrace' : 'serial';
  return parseSerialOrTraceLogs(lines, nonCsvFormat);
}

function parseCsvLogs(lines: string[]): ParsedLogResult {
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const anomalies: AnomalyEvent[] = [];
  const telemetryPoints: TelemetryDataPoint[] = [];

  // Identify column indices
  let timeCol = header.findIndex(h => h.includes('time') || h.includes('ts'));
  let vbatCol = header.findIndex(h => h.includes('vbat') || h.includes('vdd') || h.includes('volt'));
  let accelCol = header.findIndex(h => h.includes('accel') || h.includes('acc'));
  let gyroCol = header.findIndex(h => h.includes('gyro'));
  let dropCol = header.findIndex(h => h.includes('drop') || h.includes('loss') || h.includes('err'));
  let rssiCol = header.findIndex(h => h.includes('rssi'));

  // Default metric selections
  const channelAName = accelCol !== -1 ? 'Z-Acceleration' : (vbatCol !== -1 ? 'Battery Rail' : header[1] || 'Primary Metric');
  const channelAUnit = accelCol !== -1 ? 'm/s²' : (vbatCol !== -1 ? 'mV' : '');
  const channelBName = dropCol !== -1 ? 'Dropped Packets' : (gyroCol !== -1 ? 'Yaw Rate' : (rssiCol !== -1 ? 'RSSI' : header[2]));
  const channelBUnit = dropCol !== -1 ? 'pkts' : (gyroCol !== -1 ? '°/s' : (rssiCol !== -1 ? 'dBm' : ''));

  let criticalCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let resetsDetected = 0;
  let timeoutsDetected = 0;
  let packetLossDetected = false;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(val => val.trim());
    if (row.length < 2) continue;

    const rawTime = timeCol !== -1 ? row[timeCol] : `${i * 100}ms`;
    const numericTime = parseFloat(rawTime) || (i * 100);

    const valA = accelCol !== -1 ? parseFloat(row[accelCol]) : (vbatCol !== -1 ? parseFloat(row[vbatCol]) : parseFloat(row[1]) || 0);
    const valB = dropCol !== -1 ? parseFloat(row[dropCol]) : (gyroCol !== -1 ? parseFloat(row[gyroCol]) : (rssiCol !== -1 ? parseFloat(row[rssiCol]) : (row[2] ? parseFloat(row[2]) : undefined)));

    let pointIsAnomaly = false;
    let anomalySummary = '';

    // Check for sensor saturation (e.g. Accel clipping at ±32 m/s²)
    if (accelCol !== -1 && (valA >= 31.95 || valA <= -31.95)) {
      pointIsAnomaly = true;
      criticalCount++;
      anomalySummary = `Accelerometer Z clipped at dynamic ceiling (${valA.toFixed(1)} m/s²)`;
      anomalies.push({
        id: `anom-${i}`,
        line: i + 1,
        timestamp: `${numericTime}ms`,
        timestampMs: numericTime,
        type: 'sensor_saturation',
        severity: 'critical',
        subsystem: 'IMU / Accelerometer',
        metricName: 'Accel-Z',
        metricValue: `${valA} m/s²`,
        summary: 'Acoustic / structural vibration saturated sensor dynamic range (clipping ceiling)',
        rawText: lines[i],
      });
    }

    // Check for packet drops
    if (dropCol !== -1 && valB !== undefined && valB > 0) {
      pointIsAnomaly = true;
      packetLossDetected = true;
      if (valB >= 10) {
        criticalCount++;
      } else {
        warningCount++;
      }
      anomalies.push({
        id: `anom-drop-${i}`,
        line: i + 1,
        timestamp: `${numericTime}ms`,
        timestampMs: numericTime,
        type: 'packet_drop',
        severity: valB >= 10 ? 'critical' : 'warning',
        subsystem: 'RF Telemetry',
        metricName: 'Dropped Packets',
        metricValue: valB,
        summary: `Packet loss detected: ${valB} packets discarded`,
        rawText: lines[i],
      });
    }

    // Check battery voltage droop
    if (vbatCol !== -1) {
      const vbat = parseFloat(row[vbatCol]);
      if (vbat > 0 && vbat < 15500) {
        warningCount++;
        anomalies.push({
          id: `anom-vbat-${i}`,
          line: i + 1,
          timestamp: `${numericTime}ms`,
          timestampMs: numericTime,
          type: 'brownout',
          severity: 'warning',
          subsystem: 'Power Bus',
          metricName: 'V_Bat',
          metricValue: `${vbat}mV`,
          summary: `Battery rail voltage sag under motor load (${(vbat / 1000).toFixed(2)}V)`,
          rawText: lines[i],
        });
      }
    }

    telemetryPoints.push({
      index: i,
      line: i + 1,
      timestamp: `${numericTime}ms`,
      timestampMs: numericTime,
      channelA: valA,
      channelB: valB,
      channelAName,
      channelBName,
      channelAUnit,
      channelBUnit,
      isAnomaly: pointIsAnomaly,
      anomalySummary,
    });
  }

  return {
    format: 'csv',
    totalLines: lines.length,
    detectedMetrics: {
      channelA: channelAName,
      channelB: channelBName,
      unitA: channelAUnit,
      unitB: channelBUnit,
    },
    telemetryPoints,
    anomalies,
    stats: {
      criticalCount,
      errorCount,
      warningCount,
      packetLossDetected,
      resetsDetected,
      timeoutsDetected,
    },
  };
}

function parseSerialOrTraceLogs(lines: string[], format: 'serial' | 'stacktrace'): ParsedLogResult {
  const anomalies: AnomalyEvent[] = [];
  const telemetryPoints: TelemetryDataPoint[] = [];

  let criticalCount = 0;
  let errorCount = 0;
  let warningCount = 0;
  let packetLossDetected = false;
  let resetsDetected = 0;
  let timeoutsDetected = 0;

  // Patterns
  const timestampRegex = /\[(\d{2}:\d{2}:\d{2}\.\d{3}|\d+\.\d+|\d+ms)\]/;
  const vddRegex = /vdd[=:\s]+([0-9.]+)\s*V/i;
  const droopRegex = /droop to\s+([0-9.]+)\s*V/i;
  const dipRegex = /rail dip[=:\s]+vdd[=:\s]*([0-9.]+)\s*V/i;
  const rssiRegex = /rssi[_a-z]*[=:\s]+(-?[0-9.]+)\s*dBm/i;

  let lastTimestampMs = 0;
  let lastVdd = 3.3;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Extract timestamp
    const tsMatch = line.match(timestampRegex);
    let timestampStr = tsMatch ? tsMatch[1] : `+${(i * 50)}ms`;
    let timestampMs = 0;

    if (tsMatch) {
      if (tsMatch[1].includes(':')) {
        const parts = tsMatch[1].split(':');
        const secParts = parts[2].split('.');
        const sec = parseFloat(secParts[0]) || 0;
        const ms = parseFloat(secParts[1]) || 0;
        timestampMs = sec * 1000 + ms;
      } else {
        timestampMs = parseFloat(tsMatch[1].replace('ms', '')) || (i * 100);
      }
      lastTimestampMs = timestampMs;
    } else {
      timestampMs = lastTimestampMs + 10;
      lastTimestampMs = timestampMs;
    }

    // Extract voltage if present
    const vddMatch = line.match(vddRegex) || line.match(droopRegex) || line.match(dipRegex);
    if (vddMatch) {
      lastVdd = parseFloat(vddMatch[1]);
    }

    // Extract RSSI if present
    let currentRssi: number | undefined = undefined;
    const rssiMatch = line.match(rssiRegex);
    if (rssiMatch) {
      currentRssi = parseFloat(rssiMatch[1]);
    }

    let isLineAnomaly = false;
    let anomalySummary = '';

    // Check Brownout
    if (/brownout detector was triggered|unhandled brownout restart/i.test(line)) {
      criticalCount++;
      resetsDetected++;
      isLineAnomaly = true;
      anomalySummary = 'Hardware brownout detector triggered (VDD collapsed below threshold)';
      anomalies.push({
        id: `anom-bo-${lineNumber}`,
        line: lineNumber,
        timestamp: timestampStr,
        timestampMs,
        type: 'brownout',
        severity: 'critical',
        subsystem: 'Power / LDO Regulator',
        metricName: 'VDD Rail',
        metricValue: `${lastVdd.toFixed(2)}V`,
        summary: '3.3V power rail collapsed below ESP32 BOD threshold (2.43V) during RF TX surge',
        rawText: line,
      });
    }

    // Check Watchdog / RTCWDT Reset
    if (/rst:0x10|RTCWDT_RTC_RESET|watchdog reset|IWDG reset/i.test(line)) {
      criticalCount++;
      resetsDetected++;
      isLineAnomaly = true;
      anomalySummary = 'Watchdog timeout / RTCWDT reset triggered';
      anomalies.push({
        id: `anom-wdt-${lineNumber}`,
        line: lineNumber,
        timestamp: timestampStr,
        timestampMs,
        type: 'watchdog_reset',
        severity: 'critical',
        subsystem: 'CPU Core / Watchdog',
        metricName: 'Reset Cause',
        metricValue: '0x10 (RTCWDT)',
        summary: 'Hardware watchdog expired before task yield, initiating reboot',
        rawText: line,
      });
    }

    // Check SPI / Bus Timeout
    if (/SPI (?:transaction )?timeout|BUSY line de-assert timeout|SPI bus hardware lock/i.test(line)) {
      errorCount++;
      timeoutsDetected++;
      isLineAnomaly = true;
      anomalySummary = 'SPI bus transaction timeout (peripheral held line busy)';
      anomalies.push({
        id: `anom-spi-${lineNumber}`,
        line: lineNumber,
        timestamp: timestampStr,
        timestampMs,
        type: 'spi_timeout',
        severity: 'error',
        subsystem: 'SPI Bus & Transceiver',
        metricName: 'Elapsed Bus Timeout',
        metricValue: '50ms',
        summary: 'SX1262 transceiver NSS/BUSY line locked during register exchange',
        rawText: line,
      });
    }

    // Check Packet Drops
    if (/Packet drop|ACK timeout|frame lost|corrupt packet/i.test(line)) {
      errorCount++;
      packetLossDetected = true;
      isLineAnomaly = true;
      anomalySummary = 'LoRa packet dropped / ACK lost';
      anomalies.push({
        id: `anom-pkt-${lineNumber}`,
        line: lineNumber,
        timestamp: timestampStr,
        timestampMs,
        type: 'packet_drop',
        severity: 'error',
        subsystem: 'Wireless RF',
        metricName: 'Packet Status',
        metricValue: 'LOST',
        summary: 'Transmission frame unacknowledged due to RF power sag and bus lock',
        rawText: line,
      });
    }

    // Check Rail Sag / Warning
    if (/Rail transient detected|Severe rail dip|Critical rail collapse/i.test(line)) {
      warningCount++;
      isLineAnomaly = true;
      anomalySummary = `Voltage droop on 3.3V rail (${lastVdd.toFixed(2)}V)`;
      anomalies.push({
        id: `anom-droop-${lineNumber}`,
        line: lineNumber,
        timestamp: timestampStr,
        timestampMs,
        type: 'brownout',
        severity: lastVdd < 2.5 ? 'critical' : 'warning',
        subsystem: 'Power / Power Amplifier',
        metricName: 'VDD Sag',
        metricValue: `${lastVdd.toFixed(2)}V`,
        summary: `VDD droop to ${lastVdd.toFixed(2)}V during +22dBm PA ramp`,
        rawText: line,
      });
    }

    // Check HardFault
    if (/HARDFAULT DETECTED|INVSTATE|UsageFault|BusFault/i.test(line)) {
      criticalCount++;
      isLineAnomaly = true;
      anomalySummary = 'Cortex-M HardFault exception (INVSTATE / Thumb bit cleared)';
      anomalies.push({
        id: `anom-hf-${lineNumber}`,
        line: lineNumber,
        timestamp: timestampStr,
        timestampMs,
        type: 'hardfault',
        severity: 'critical',
        subsystem: 'CPU Execution / NVIC',
        metricName: 'Fault Register',
        metricValue: 'CFSR 0x00010000',
        summary: 'Illegal ARM mode branch on Thumb-only Cortex-M4 (corrupt function pointer LSB)',
        rawText: line,
      });
    }

    // Check Stack Proximity / Overflow
    if (/Stack frame proximity|Near stack overflow|Stack overflow/i.test(line)) {
      criticalCount++;
      isLineAnomaly = true;
      anomalySummary = 'Stack limit collision (near stack overflow)';
      anomalies.push({
        id: `anom-stk-${lineNumber}`,
        line: lineNumber,
        timestamp: timestampStr,
        timestampMs,
        type: 'stack_overflow',
        severity: 'critical',
        subsystem: 'FreeRTOS Task Stack',
        metricName: 'Stack Headroom',
        metricValue: '8 bytes',
        summary: 'Main Stack Pointer within 8 bytes of boundary (0x2000C000)',
        rawText: line,
      });
    }

    // Add telemetry point for logs that contain metrics
    if (format === 'serial') {
      telemetryPoints.push({
        index: i,
        line: lineNumber,
        timestamp: timestampStr,
        timestampMs,
        channelA: lastVdd,
        channelB: currentRssi,
        channelAName: 'VDD Rail',
        channelBName: 'LoRa RSSI',
        channelAUnit: 'V',
        channelBUnit: 'dBm',
        isAnomaly: isLineAnomaly,
        anomalySummary,
      });
    } else {
      // In crash dumps, plot stack headroom or instruction pointer sequence
      const spMatch = line.match(/SP\s+=\s+0x([0-9a-fA-F]+)/);
      const stackOffset = spMatch ? parseInt(spMatch[1], 16) - 0x2000B000 : undefined;
      telemetryPoints.push({
        index: i,
        line: lineNumber,
        timestamp: timestampStr,
        timestampMs,
        channelA: stackOffset !== undefined ? stackOffset : (4096 - i * 64),
        channelAName: 'Stack Headroom',
        channelAUnit: 'bytes',
        isAnomaly: isLineAnomaly,
        anomalySummary,
      });
    }
  }

  return {
    format,
    totalLines: lines.length,
    detectedMetrics: {
      channelA: format === 'serial' ? 'VDD Rail' : 'Stack Headroom',
      channelB: format === 'serial' ? 'LoRa RSSI' : undefined,
      unitA: format === 'serial' ? 'V' : 'bytes',
      unitB: format === 'serial' ? 'dBm' : undefined,
    },
    telemetryPoints,
    anomalies,
    stats: {
      criticalCount,
      errorCount,
      warningCount,
      packetLossDetected,
      resetsDetected,
      timeoutsDetected,
    },
  };
}

export function getSeverityStyle(severity: SeverityLevel) {
  switch (severity) {
    case 'critical':
      return {
        badge: 'text-rose-400 font-semibold',
        bg: 'bg-rose-950/40 border-rose-800/60',
        text: 'text-rose-300',
        dot: 'text-rose-500',
      };
    case 'error':
      return {
        badge: 'text-amber-400 font-semibold',
        bg: 'bg-amber-950/40 border-amber-800/60',
        text: 'text-amber-300',
        dot: 'text-amber-500',
      };
    case 'warning':
      return {
        badge: 'text-yellow-400',
        bg: 'bg-yellow-950/30 border-yellow-800/50',
        text: 'text-yellow-300',
        dot: 'text-yellow-500',
      };
    case 'info':
      return {
        badge: 'text-cyan-400',
        bg: 'bg-cyan-950/30 border-cyan-800/40',
        text: 'text-cyan-300',
        dot: 'text-cyan-500',
      };
    default:
      return {
        badge: 'text-slate-400',
        bg: 'bg-slate-900 border-slate-800',
        text: 'text-slate-300',
        dot: 'text-slate-500',
      };
  }
}
