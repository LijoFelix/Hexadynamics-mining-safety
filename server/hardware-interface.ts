/**
 * Hardware Abstraction Layer (HAL) for Mining Safety System
 * 
 * Provides standard interfaces for physical sensors (Thermal Camera, GPS/GNSS, IMU, LiDAR/Radar)
 * allowing plug-and-play transitions between SIMULATION MODE and HARDWARE MODE.
 */

export interface GPSReading {
  latitude: number;
  longitude: number;
  altitudeM: number;
  speedKmh: number;
  headingDeg: number;
  satelliteCount: number;
  hdop: number;
  timestamp: string;
}

export interface IMUReading {
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  timestamp: string;
}

export interface ThermalRawFrame {
  width: number;
  height: number;
  minTempC: number;
  maxTempC: number;
  avgTempC: number;
  centerSpotTempC: number;
  rawTemperatureMatrix?: number[][]; // [H][W] array of floating temp readings
  timestamp: string;
}

export interface DistanceSensorReading {
  channelId: string;
  distanceMeters: number;
  confidence: number;
  sensorType: 'LIDAR' | 'MILLIMETER_WAVE_RADAR' | 'ULTRASONIC';
  timestamp: string;
}

/**
 * Clean hardware interfaces
 */
export interface IGPSInterface {
  connect(portOrIp: string): Promise<boolean>;
  disconnect(): Promise<void>;
  getReading(): Promise<GPSReading>;
  isConnected(): boolean;
}

export interface IIMUInterface {
  connect(i2cOrSerial: string): Promise<boolean>;
  disconnect(): Promise<void>;
  getReading(): Promise<IMUReading>;
  isConnected(): boolean;
}

export interface IThermalCameraInterface {
  connect(rtspOrUsbDevice: string): Promise<boolean>;
  disconnect(): Promise<void>;
  getFrame(): Promise<ThermalRawFrame>;
  isConnected(): boolean;
}

export interface IDistanceSensorInterface {
  connect(canBusOrSerial: string): Promise<boolean>;
  disconnect(): Promise<void>;
  getDistances(): Promise<DistanceSensorReading[]>;
  isConnected(): boolean;
}
