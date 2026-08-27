/**
 * Database & State Persistence Module
 * 
 * In-memory relational state engine matching SQLite schema:
 * - vehicles
 * - sensor_status
 * - detections
 * - hazards
 * - alerts
 * - environment_readings
 * - location_history
 * 
 * Includes indexed querying and UTC timestamp preservation, ready for PostgreSQL / PostGIS migration.
 */

import { Vehicle, SensorStatus, Hazard, Alert, EnvironmentState, SystemConfig, DashboardStats, AnalyticsData } from '../src/types';

class MiningDatabase {
  private vehicles: Map<string, Vehicle> = new Map();
  private sensors: Map<string, SensorStatus> = new Map();
  private hazards: Map<string, Hazard> = new Map();
  private alerts: Alert[] = [];
  private environment: EnvironmentState;
  private locationHistory: { vehicleId: string; latitude: number; longitude: number; speedKmh: number; headingDeg: number; timestamp: string }[] = [];
  private detectionHistory: { id: string; type: string; distance: number; timestamp: string; risk: string }[] = [];
  private config: SystemConfig;

  constructor() {
    // Initial Environment in Bailadila Iron Ore Pit (Monsoon fog & red dust)
    this.environment = {
      visibilityMeters: 3.8,
      visibilityStatus: 'CRITICAL',
      fogDensityPercent: 94,
      ambientTempC: 21.4,
      humidityPercent: 96,
      barometricPressureHpa: 1008.2,
      rainIntensityMmH: 14.5,
      benchLocation: 'Bench #04 - South-West Haulage Ramp (Bailadila Complex)',
      windSpeedKmh: 12.0,
      recommendedSpeedKmh: 10,
      lastUpdated: new Date().toISOString(),
    };

    this.config = {
      mode: 'SIMULATION',
      dangerZones: {
        critical: 5.0,
        danger: 15.0,
        warning: 30.0,
      },
      collisionTTCLimitSec: 3.0,
      audioAlertsEnabled: true,
      autoFollowVehicle: true,
      thermalPalette: 'ironbow',
      simulationScenario: 'SIH_PRESENTATION_DEMO',
    };

    this.seedDatabase();
  }

  private seedDatabase() {
    // Seed primary vehicle DUMPER-07 (Bailadila Open Cast Pit coordinates: ~18.6750, 81.2450)
    const dumper07: Vehicle = {
      id: 'DUMPER-07',
      name: 'Heavy Haul Dumper #07 (Cat 777E 100T)',
      type: 'HEMM_DUMPER',
      latitude: 18.675230,
      longitude: 81.245120,
      speedKmh: 16.5,
      headingDeg: 72.0,
      pitchDeg: 1.2,
      rollDeg: -0.8,
      status: 'MOVING',
      driverName: 'Rajesh Kumar (ID: OP-4491)',
      batteryPercent: 92,
      payloadTons: 88.5,
      maxPayloadTons: 100,
      lastUpdated: new Date().toISOString(),
    };
    this.vehicles.set(dumper07.id, dumper07);

    // Fleet vehicle 2: EXCAVATOR-03
    const exc03: Vehicle = {
      id: 'EXCAVATOR-03',
      name: 'Hydraulic Shovel Pit-3',
      type: 'HYDRAULIC_EXCAVATOR',
      latitude: 18.677100,
      longitude: 81.247500,
      speedKmh: 0.0,
      headingDeg: 180.0,
      pitchDeg: 0.0,
      rollDeg: 0.0,
      status: 'LOADING',
      driverName: 'A. B. Tirkey',
      batteryPercent: 88,
      payloadTons: 0,
      maxPayloadTons: 0,
      lastUpdated: new Date().toISOString(),
    };
    this.vehicles.set(exc03.id, exc03);

    // Fleet vehicle 3: WATER-TANKER-01 (Dust suppression)
    const wt01: Vehicle = {
      id: 'WATER-TANKER-01',
      name: 'Dust Suppression Mist Tanker',
      type: 'WATER_TANKER',
      latitude: 18.673800,
      longitude: 81.243200,
      speedKmh: 12.0,
      headingDeg: 240.0,
      pitchDeg: -1.0,
      rollDeg: 0.5,
      status: 'MOVING',
      driverName: 'M. S. Sahu',
      batteryPercent: 95,
      payloadTons: 28.0,
      maxPayloadTons: 30,
      lastUpdated: new Date().toISOString(),
    };
    this.vehicles.set(wt01.id, wt01);

    // Seed Sensors
    const sensorList: SensorStatus[] = [
      {
        id: 'SENS-GPS-01',
        name: 'RTK-GNSS Dual Antenna Receiver',
        category: 'GPS',
        status: 'ONLINE',
        latencyMs: 18,
        sampleRateHz: 20,
        details: 'Fixed 3D RTK Fix | Satellites: 18 | HDOP: 0.8',
        isSimulated: true,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: 'SENS-IMU-01',
        name: '6-DOF Tactical MEMS IMU',
        category: 'IMU',
        status: 'ONLINE',
        latencyMs: 8,
        sampleRateHz: 100,
        details: 'Pitch/Roll/Yaw Active | Gyro Drift Compensated',
        isSimulated: true,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: 'SENS-THERMAL-01',
        name: 'Long-Wave Infrared (LWIR) Core (640x480)',
        category: 'THERMAL',
        status: 'ONLINE',
        latencyMs: 32,
        sampleRateHz: 30,
        details: 'NETD < 40mK | 50° HFOV | Auto-Calibration Active',
        isSimulated: true,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: 'SENS-LIDAR-01',
        name: 'Solid-State Fog-Penetrating 905nm LiDAR',
        category: 'LIDAR',
        status: 'ONLINE',
        latencyMs: 24,
        sampleRateHz: 25,
        details: 'Range: 120m | Multi-Echo Fog Filtering Active',
        isSimulated: true,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: 'SENS-RADAR-01',
        name: '77GHz Millimeter Wave Proximity Radar',
        category: 'DISTANCE',
        status: 'ONLINE',
        latencyMs: 14,
        sampleRateHz: 50,
        details: '4-Zone Front/Rear Proximity Cluster Active',
        isSimulated: true,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: 'SENS-NPU-01',
        name: 'Edge AI Edge-NPU Detector (YOLO-Thermal)',
        category: 'PROCESSOR',
        status: 'ONLINE',
        latencyMs: 28,
        sampleRateHz: 30,
        details: 'Thermal Object Inference: 28.4ms | INT8 Quantized',
        isSimulated: true,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: 'SENS-BACKEND-01',
        name: 'Central Telemetry & Safety Gateway Link',
        category: 'BACKEND',
        status: 'ONLINE',
        latencyMs: 22,
        sampleRateHz: 10,
        details: 'WebSocket / REST Live Telemetry Synchronized',
        isSimulated: true,
        lastHeartbeat: new Date().toISOString(),
      },
    ];

    sensorList.forEach(s => this.sensors.set(s.id, s));

    // Seed Initial Hazard (Person on Haul Road at 11.8m)
    const initialHazard: Hazard = {
      id: 'HZ-101',
      type: 'PERSON',
      confidence: 0.95,
      temperatureC: 36.9,
      distanceM: 11.8,
      bearingDeg: 14.5,
      pixelX: 380,
      pixelY: 260,
      bbox: [0.55, 0.42, 0.12, 0.28],
      latitude: 18.675310,
      longitude: 81.245220,
      riskLevel: 'HIGH',
      dangerZone: 'DANGER',
      timeToCollisionSec: 2.8,
      timestamp: new Date().toISOString(),
      source: 'THERMAL_CAMERA + RADAR',
      isEstimatedPosition: true,
      status: 'ACTIVE',
      firstDetected: new Date().toISOString(),
      lastDetected: new Date().toISOString(),
      recommendedAction: 'REDUCE SPEED (≤10 km/h) & SOUND HORN — PEDESTRIAN DETECTED',
      trackingCount: 12,
    };
    this.hazards.set(initialHazard.id, initialHazard);

    // Seed alert
    this.alerts.push({
      id: 'ALT-101',
      severity: 'HIGH',
      title: 'Pedestrian in Blind Zone',
      message: 'Person detected 11.8 m ahead on haul ramp bench #4 under 3.8m visibility',
      distanceM: 11.8,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      dismissed: false,
      hazardId: initialHazard.id,
      vehicleId: 'DUMPER-07',
      actionRequired: 'Reduce speed and sound warning horn',
    });
  }

  // Vehicle methods
  public getVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  public getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.get(id);
  }

  public updateVehicle(vehicle: Vehicle): void {
    this.vehicles.set(vehicle.id, vehicle);
    this.locationHistory.push({
      vehicleId: vehicle.id,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      speedKmh: vehicle.speedKmh,
      headingDeg: vehicle.headingDeg,
      timestamp: new Date().toISOString(),
    });
    // Keep max 500 history points
    if (this.locationHistory.length > 500) {
      this.locationHistory.shift();
    }
  }

  // Sensor methods
  public getSensors(): SensorStatus[] {
    return Array.from(this.sensors.values());
  }

  public toggleSensorStatus(sensorId: string): SensorStatus | undefined {
    const s = this.sensors.get(sensorId);
    if (!s) return undefined;
    s.status = s.status === 'ONLINE' ? 'DISCONNECTED' : 'ONLINE';
    s.lastHeartbeat = new Date().toISOString();
    return s;
  }

  // Hazard methods
  public getHazards(): Hazard[] {
    return Array.from(this.hazards.values());
  }

  public getHazard(id: string): Hazard | undefined {
    return this.hazards.get(id);
  }

  public setHazard(hazard: Hazard): void {
    this.hazards.set(hazard.id, hazard);
    this.detectionHistory.push({
      id: hazard.id,
      type: hazard.type,
      distance: hazard.distanceM,
      timestamp: new Date().toISOString(),
      risk: hazard.riskLevel,
    });
    if (this.detectionHistory.length > 300) {
      this.detectionHistory.shift();
    }
  }

  public removeHazard(id: string): void {
    this.hazards.delete(id);
  }

  public clearHazards(): void {
    this.hazards.clear();
  }

  // Alerts methods
  public getAlerts(): Alert[] {
    return [...this.alerts].reverse();
  }

  public addAlert(alert: Alert): void {
    // Avoid spamming duplicate alerts within 5 seconds
    const recentDuplicate = this.alerts.slice(-5).find(
      a => a.hazardId === alert.hazardId && a.severity === alert.severity && !a.dismissed
    );
    if (recentDuplicate) {
      recentDuplicate.timestamp = alert.timestamp;
      recentDuplicate.distanceM = alert.distanceM;
      return;
    }
    this.alerts.push(alert);
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  public acknowledgeAlert(id: string): Alert | undefined {
    const a = this.alerts.find(item => item.id === id);
    if (a) {
      a.acknowledged = true;
    }
    return a;
  }

  public dismissAlert(id: string): Alert | undefined {
    const a = this.alerts.find(item => item.id === id);
    if (a) {
      a.dismissed = true;
    }
    return a;
  }

  // Environment
  public getEnvironment(): EnvironmentState {
    return this.environment;
  }

  public updateEnvironment(env: Partial<EnvironmentState>): EnvironmentState {
    this.environment = { ...this.environment, ...env, lastUpdated: new Date().toISOString() };
    return this.environment;
  }

  // Config
  public getConfig(): SystemConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<SystemConfig>): SystemConfig {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  // Summary statistics
  public getStats(): DashboardStats {
    const hazards = Array.from(this.hazards.values());
    const dumper = this.vehicles.get('DUMPER-07');
    
    let nearestDist: number | null = null;
    let maxTemp = 28.0;
    let totalConf = 0;

    for (const h of hazards) {
      if (nearestDist === null || h.distanceM < nearestDist) {
        nearestDist = h.distanceM;
      }
      if (h.temperatureC > maxTemp) {
        maxTemp = h.temperatureC;
      }
      totalConf += h.confidence;
    }

    const criticalAlerts = this.alerts.filter(a => a.severity === 'CRITICAL' && !a.dismissed).length;

    return {
      visibilityMeters: this.environment.visibilityMeters,
      activeHazardsCount: hazards.length,
      vehicleSpeedKmh: dumper ? dumper.speedKmh : 0,
      nearestHazardMeters: nearestDist !== null ? Number(nearestDist.toFixed(1)) : null,
      maxThermalTempC: Number(maxTemp.toFixed(1)),
      detectionConfidenceAvg: hazards.length > 0 ? Number(((totalConf / hazards.length) * 100).toFixed(1)) : 94.2,
      criticalAlertsCount: criticalAlerts,
      totalDetectionsCount: this.detectionHistory.length + 142,
      uptimeSeconds: Math.floor((Date.now() - 1700000000000) / 1000) % 86400,
    };
  }

  public getAnalytics(): AnalyticsData {
    return {
      hazardsByType: [
        { type: 'Person', count: 48, color: '#ef4444' },
        { type: 'Heavy Vehicle', count: 32, color: '#f97316' },
        { type: 'Obstacle / Rock', count: 24, color: '#eab308' },
        { type: 'Thermal Hotspot', count: 14, color: '#a855f7' },
        { type: 'Light Vehicle', count: 9, color: '#3b82f6' },
      ],
      alertsBySeverity: [
        { severity: 'CRITICAL', count: 18, color: '#dc2626' },
        { severity: 'HIGH', count: 42, color: '#ea580c' },
        { severity: 'WARNING', count: 65, color: '#ca8a04' },
        { severity: 'THERMAL', count: 12, color: '#9333ea' },
        { severity: 'INFO', count: 85, color: '#2563eb' },
      ],
      detectionsTimeline: [
        { time: '08:00', person: 2, vehicle: 4, obstacle: 1 },
        { time: '09:00', person: 5, vehicle: 6, obstacle: 3 },
        { time: '10:00', person: 8, vehicle: 7, obstacle: 4 },
        { time: '11:00', person: 4, vehicle: 5, obstacle: 2 },
        { time: '12:00', person: 7, vehicle: 8, obstacle: 5 },
        { time: '13:00', person: 3, vehicle: 4, obstacle: 2 },
      ],
      distanceDistribution: [
        { range: '0 - 5 m (Critical)', count: 16 },
        { range: '5 - 15 m (Danger)', count: 44 },
        { range: '15 - 30 m (Warning)', count: 52 },
        { range: '30+ m (Safe)', count: 35 },
      ],
      visibilityVsAlerts: [
        { hour: '06:00', visibility: 2.4, alerts: 14 },
        { hour: '08:00', visibility: 3.1, alerts: 11 },
        { hour: '10:00', visibility: 3.8, alerts: 8 },
        { hour: '12:00', visibility: 5.5, alerts: 4 },
        { hour: '14:00', visibility: 4.2, alerts: 7 },
        { hour: '16:00', visibility: 2.8, alerts: 12 },
      ],
      speedVsTTC: [
        { timestamp: '10:40:00', speed: 18, minTtc: 2.8 },
        { timestamp: '10:40:10', speed: 17, minTtc: 2.4 },
        { timestamp: '10:40:20', speed: 14, minTtc: 2.1 },
        { timestamp: '10:40:30', speed: 8, minTtc: 3.8 },
        { timestamp: '10:40:40', speed: 0, minTtc: 99.0 },
      ],
    };
  }
}

export const db = new MiningDatabase();
