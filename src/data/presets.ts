import { SamplePreset } from '../types';

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'esp32-lora-brownout',
    name: 'ESP32 / SX1262 LoRa Node Brownout & SPI Timeout',
    device: 'ESP32-WROOM-32D + Semtech SX1262 (SPI Bus)',
    iconName: 'Radio',
    category: 'IoT / Wireless',
    description: 'Intermittent SPI bus timeouts during LoRa transmission spikes (+22 dBm PA boost) causing severe VDD rail droop below 2.45V and triggering hardware brownout reset.',
    expectedRootCause: 'Inadequate bulk decoupling capacitance on 3.3V power rail during SX1262 140mA TX power amplifier surge, causing rail voltage to collapse below ESP32 BOD threshold (2.43V).',
    content: `[00:00:00.104] [BOOT] ESP-IDF v4.4.2-dirty 2nd stage bootloader
[00:00:00.112] [BOOT] compile time Jun 14 2024 09:21:04
[00:00:00.120] [BOOT] chip revision: 3, crystal: 40MHz
[00:00:00.128] [BOOT] CPU0 reset reason: Power-on reset (0x1)
[00:00:00.136] [INIT] Initializing I2C bus: SDA=GPIO21, SCL=GPIO22, freq=400kHz
[00:00:00.144] [INIT] BME280 sensor found at 0x76. Calibration OK.
[00:00:00.152] [INIT] Initializing SPI bus: MOSI=GPIO23, MISO=GPIO19, SCLK=GPIO18, CS=GPIO5
[00:00:00.160] [INIT] SX1262 transceiver detected: Silicon Rev 0x02
[00:00:00.170] [INIT] Radio config: Freq=915.0MHz, SF=7, BW=125kHz, CR=4/5, SyncWord=0x1424
[00:00:00.185] [APP] Telemetry task running on Core 1, priority=5
[00:00:01.000] [DATA] cycle=1 | temp=24.2C | hum=48.2% | press=1013.2hPa | vdd=3.29V | batt=4.12V
[00:00:01.045] [LORA] TX packet #1 (payload=28 bytes, pwr=+14dBm, vdd=3.26V)
[00:00:01.120] [LORA] TX done (airtime=62ms, rssi_ack=-84dBm, vdd=3.29V)
[00:00:02.000] [DATA] cycle=2 | temp=24.3C | hum=48.1% | press=1013.2hPa | vdd=3.28V | batt=4.12V
[00:00:02.042] [LORA] TX packet #2 (payload=28 bytes, pwr=+14dBm, vdd=3.25V)
[00:00:02.118] [LORA] TX done (airtime=62ms, rssi_ack=-86dBm, vdd=3.28V)
[00:00:03.000] [DATA] cycle=3 | temp=24.5C | hum=47.9% | press=1013.1hPa | vdd=3.29V | batt=4.11V
[00:00:03.050] [LORA] Adaptive Data Rate: Increasing TX power to +22dBm (High PA mode)
[00:00:03.055] [LORA] TX packet #3 (payload=54 bytes, pwr=+22dBm, vdd=3.28V)
[00:00:03.072] [WARN] [PWR] Rail transient detected: vdd droop to 2.82V during PA_BOOST ramp
[00:00:03.180] [LORA] TX done (airtime=114ms, rssi_ack=-108dBm, vdd=3.27V)
[00:00:04.000] [DATA] cycle=4 | temp=24.8C | hum=47.8% | press=1013.0hPa | vdd=3.28V | batt=4.10V
[00:00:04.045] [LORA] TX packet #4 (payload=64 bytes, pwr=+22dBm, vdd=3.27V)
[00:00:04.062] [WARN] [PWR] Rail transient detected: vdd droop to 2.68V
[00:00:04.195] [LORA] TX done (airtime=132ms, rssi_ack=-112dBm, vdd=3.27V)
[00:00:05.000] [DATA] cycle=5 | temp=25.1C | hum=47.5% | press=1012.9hPa | vdd=3.27V | batt=4.09V
[00:00:05.048] [LORA] TX packet #5 (payload=82 bytes, pwr=+22dBm, vdd=3.26V)
[00:00:05.065] [WARN] [PWR] Severe rail dip: vdd=2.48V (threshold margin: 50mV)
[00:00:05.070] [WARN] [SX1262] BUSY line de-assert timeout: busy_pin=1 after 20ms
[00:00:05.090] [ERROR] [SX1262] SPI transaction timeout waiting for NSS ready (errno=ETIMEDOUT, elapsed=50ms)
[00:00:05.092] [WARN] [SPI] SPI bus hardware lock: MOSI line held LOW by slave
[00:00:05.095] [ERROR] [LORA] Packet drop #5: ACK timeout, frame lost in TX FIFO
[00:00:05.110] [WARN] [PWR] Critical rail collapse: vdd=2.38V (measured on ADC1_CH0)
[00:00:05.115] [CRIT] Brownout detector was triggered
[00:00:05.118] ets Jun  8 2016 00:22:57
[00:00:05.120] rst:0x10 (RTCWDT_RTC_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)
[00:00:05.124] configsip: 0, SPIWP:0xee
[00:00:05.128] clk_drv:0x00,q_drv:0x00,d_drv:0x00,cs0_drv:0x00,hd_drv:0x00,wp_drv:0x00
[00:00:05.132] mode:DIO, clock div:2
[00:00:05.136] load:0x3fff0030,len:1184
[00:00:05.140] load:0x40078000,len:13824
[00:00:05.144] ho 0 tail 12 room 4
[00:00:05.148] load:0x40080400,len:4
[00:00:05.152] [BOOT] ESP32 recovered from unhandled brownout restart!`,
  },
  {
    id: 'stm32-hardfault-crash',
    name: 'STM32 Cortex-M4 HardFault Register & Stack Trace',
    device: 'STM32F407VGT6 (ARM Cortex-M4F @ 168MHz)',
    iconName: 'Cpu',
    category: 'Automotive / Embedded',
    description: 'System crash triggered by UsageFault INVSTATE (illegal ARM mode switch on Thumb-only Cortex-M4) caused by corrupt function pointer in FreeRTOS CANbus Rx interrupt context.',
    expectedRootCause: 'ISR callback table corruption or function pointer without LSB Thumb bit (bit 0 = 0) being loaded into Program Counter during xQueueSendFromISR callback, triggering INVSTATE UsageFault escalation into HardFault.',
    content: `[00:01:24.012] [SYSTEM] CAN1 initialized at 500kbps (CAN_SILENT=0, CAN_LOOPBACK=0)
[00:01:24.018] [SYSTEM] FreeRTOS kernel started. Heap remaining: 24512 bytes
[00:01:24.100] [CAN] Rx mailbox 0: ID=0x18F00401 (Engine RPM=2150, Torque=420Nm, Temp=88C)
[00:01:24.200] [CAN] Rx mailbox 0: ID=0x18FEF100 (WheelSpeed FL=54.2, FR=54.1, RL=54.0, RR=54.1 km/h)
[00:01:24.300] [CAN] Rx mailbox 0: ID=0x18F00401 (Engine RPM=2200, Torque=435Nm, Temp=89C)
[00:01:24.400] [CAN] Rx mailbox 0: ID=0x0CF00300 (Accel Pedal Pos=62.4%, Brake Switch=0)
[00:01:24.500] [CAN] Rx mailbox 1: ID=0x18FEF500 (Diagnostic Request from ECU tester)
[00:01:24.502] [DEBUG] Dispatching CAN payload to handler table at 0x20002800 (entry 14)
[00:01:24.505] [WARN] Pointer validation warning: handler callback ptr = 0x08003f40 (LSB Thumb bit cleared!)
[00:01:24.506] [CRIT] !!! HARDFAULT DETECTED !!!
[00:01:24.508] ==================== HARDFAULT REGISTER DUMP ====================
[00:01:24.510] R0  = 0x20002810  (CAN_RxMessage_t pointer)
[00:01:24.512] R1  = 0x00000008  (DLC length)
[00:01:24.514] R2  = 0x00000001  (Mailbox index)
[00:01:24.516] R3  = 0x08003f40  (Target function pointer: corrupt Thumb bit 0=0)
[00:01:24.518] R12 = 0x200002a0
[00:01:24.520] LR  = 0x080012bf  (Return address: CAN1_RX0_IRQHandler + 0x47)
[00:01:24.522] PC  = 0x08003f40  (Faulting instruction address)
[00:01:24.524] PSR = 0x01000000  (Default Thumb state bit set in EPSR)
[00:01:24.526] -------------------- FAULT STATUS REGISTERS --------------------
[00:01:24.528] HFSR  = 0x40000000  (FORCED: HardFault triggered by escalated unhandled fault)
[00:01:24.530] CFSR  = 0x00010000  (UsageFault: INVSTATE - Invalid Execution State on branch)
[00:01:24.532] MMFSR = 0x00        (No MemManage fault)
[00:01:24.534] BFSR  = 0x00        (No BusFault)
[00:01:24.536] UFSR  = 0x0001      (UNDEFINSTR / INVSTATE: Attempt to execute ARM 32-bit instruction on Thumb-only M4 core)
[00:01:24.538] MMAR  = 0xe000ed34  (MemManage Address Register)
[00:01:24.540] BFAR  = 0xe000ed38  (BusFault Address Register)
[00:01:24.542] SP    = 0x2000bff8  (Main Stack Pointer, 8 bytes from stack bottom!)
[00:01:24.544] [CRIT] Stack frame proximity: MSP is within 8 bytes of stack limit (0x2000C000). Near stack overflow!
[00:01:24.548] [HALT] Core locked in Infinite Loop: NVIC_SystemReset recommended`,
  },
  {
    id: 'px4-drone-sensor-saturation',
    name: 'PX4 Drone Sensor Saturation & Vibration CSV',
    device: 'Pixhawk 6X / PX4 Autopilot (ICM-42688-P IMU + MS5611 Baro)',
    iconName: 'Plane',
    category: 'Robotics / Flight',
    description: 'High motor throttle causes severe high-frequency motor vibration resonance, causing accelerometer clipping (saturation at ±32 m/s²), gyro drift, and 28% telemetry packet drops.',
    expectedRootCause: 'Unbalanced carbon fiber propeller on motor #3 creating severe 180Hz acoustic resonance exceeding dampening silicone limits, saturating ICM-42688-P accelerometer dynamic range and desyncing EKF2 attitude estimator.',
    content: `timestamp_ms,vbat_mv,accel_z_mps2,gyro_yaw_deg_s,baro_alt_m,rssi_dbm,dropped_packets
1000,16780,9.81,0.02,12.4,-62,0
1100,16750,9.78,0.05,12.5,-62,0
1200,16720,9.84,-0.03,12.6,-63,0
1300,16690,9.82,0.01,12.7,-62,0
1400,16660,10.21,0.85,13.1,-63,0
1500,16610,11.45,1.20,13.8,-64,0
1600,16540,14.80,2.15,14.9,-65,0
1700,16480,18.90,3.40,16.2,-66,0
1800,16390,24.10,5.80,18.0,-67,1
1900,16280,28.95,9.40,20.4,-68,2
2000,16150,31.95,14.20,23.1,-70,4
2100,16020,32.00,22.80,26.2,-72,7
2200,15880,32.00,34.50,29.5,-75,11
2300,15720,32.00,48.20,32.8,-79,16
2400,15540,32.00,64.10,35.4,-84,24
2500,15350,32.00,82.40,37.2,-88,35
2600,15210,32.00,78.10,38.5,-92,42
2700,15150,31.85,62.30,39.1,-90,38
2800,15100,27.40,41.20,39.8,-86,28
2900,15050,21.10,24.50,40.1,-82,18
3000,15020,16.50,12.10,40.3,-78,10
3100,15000,12.30,6.40,40.4,-74,6
3200,14980,10.15,2.80,40.4,-70,3
3300,14960,9.92,1.10,40.5,-68,1
3400,14950,9.83,0.40,40.5,-66,0
3500,14940,9.81,0.15,40.5,-65,0`,
  },
];
