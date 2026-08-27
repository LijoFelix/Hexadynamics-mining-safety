export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export type ObjectType =
  | 'PERSON'
  | 'DUMPER'
  | 'EXCAVATOR'
  | 'TRUCK'
  | 'LIGHT_VEHICLE'
  | 'OBSTACLE'
  | 'THERMAL_HOTSPOT'
  | 'UNKNOWN';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'WARNING' | 'THERMAL' | 'INFO';

export type SensorStatusType = 'ONLINE' | 'DEGRADED' | 'DISCONNECTED' | 'ERROR';

export type ThermalPalette = 'ironbow' | 'rainbow' | 'whitehot' | 'blackhot';

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDeg: number;
  pitchDeg: number;
  rollDeg: number;
  status: 'MOVING' | 'IDLE' | 'LOADING' | 'ALERT' | 'STOPPED';
  driverName: string;
  batteryPercent: number;
  fuelPercent?: number;
  engineTempC?: number;
  payloadTons: number;
  maxPayloadTons: number;
  lastUpdated: string;
}

export interface SensorStatus {
  id: string;
  name: string;
  category: 'GPS' | 'IMU' | 'THERMAL' | 'LIDAR' | 'DISTANCE' | 'PROCESSOR' | 'BACKEND';
  status: SensorStatusType;
  latencyMs: number;
  sampleRateHz: number;
  details: string;
  isSimulated: boolean;
  lastHeartbeat: string;
}

export interface Detection {
  id: string;
  type: ObjectType;
  confidence: number;
  temperatureC: number;
  distanceM: number;
  bearingDeg: number;
  pixelX: number;
  pixelY: number;
  bbox: [number, number, number, number]; // [x, y, width, height] in normalized 0-1
  latitude: number;
  longitude: number;
  riskLevel: RiskLevel;
  timeToCollisionSec: number | null;
  relativeSpeedKmh?: number;
  timestamp: string;
  source: string;
  isEstimatedPosition: boolean;
}

export interface Hazard extends Detection {
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  dangerZone: 'CRITICAL' | 'DANGER' | 'WARNING' | 'SAFE';
  firstDetected: string;
  lastDetected: string;
  recommendedAction: string;
  trackingCount: number;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  distanceM?: number;
  timestamp: string;
  acknowledged: boolean;
  dismissed: boolean;
  hazardId?: string;
  vehicleId: string;
  actionRequired?: string;
}

export interface EnvironmentState {
  visibilityMeters: number;
  visibilityStatus: 'CRITICAL' | 'POOR' | 'MODERATE' | 'GOOD';
  fogDensityPercent: number;
  ambientTempC: number;
  humidityPercent: number;
  barometricPressureHpa: number;
  rainIntensityMmH: number;
  benchLocation: string;
  windSpeedKmh: number;
  recommendedSpeedKmh: number;
  lastUpdated: string;
}

export interface SystemConfig {
  mode: 'SIMULATION' | 'HARDWARE';
  dangerZones: {
    critical: number; // e.g. 5m
    danger: number;   // e.g. 15m
    warning: number;  // e.g. 30m
  };
  collisionTTCLimitSec: number;
  audioAlertsEnabled: boolean;
  autoFollowVehicle: boolean;
  thermalPalette: ThermalPalette;
  simulationScenario: string;
}

export interface DashboardStats {
  visibilityMeters: number;
  activeHazardsCount: number;
  vehicleSpeedKmh: number;
  nearestHazardMeters: number | null;
  maxThermalTempC: number;
  detectionConfidenceAvg: number;
  criticalAlertsCount: number;
  totalDetectionsCount: number;
  uptimeSeconds: number;
}

export interface AnalyticsData {
  hazardsByType: { type: string; count: number; color: string }[];
  alertsBySeverity: { severity: string; count: number; color: string }[];
  detectionsTimeline: { time: string; person: number; vehicle: number; obstacle: number }[];
  distanceDistribution: { range: string; count: number }[];
  visibilityVsAlerts: { hour: string; visibility: number; alerts: number }[];
  speedVsTTC: { timestamp: string; speed: number; minTtc: number }[];
}

export type WSMessage =
  | { type: 'vehicle_location_updated'; payload: Vehicle }
  | { type: 'new_detection'; payload: Detection }
  | { type: 'hazard_created'; payload: Hazard }
  | { type: 'hazard_updated'; payload: Hazard }
  | { type: 'alert_created'; payload: Alert }
  | { type: 'sensor_status_changed'; payload: SensorStatus[] }
  | { type: 'environment_updated'; payload: EnvironmentState }
  | { type: 'stats_updated'; payload: DashboardStats }
  | { type: 'full_sync'; payload: {
      vehicle: Vehicle;
      hazards: Hazard[];
      alerts: Alert[];
      sensors: SensorStatus[];
      environment: EnvironmentState;
      stats: DashboardStats;
      config: SystemConfig;
    }
  };
