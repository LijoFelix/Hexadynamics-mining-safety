/**
 * Real-Time Simulation Engine for Open Cast Iron Ore Mine (Bailadila Region)
 * 
 * Generates:
 * - Vehicle movement along bench haul roads with realistic speed, heading, and pitch/roll
 * - Thermal detections with false-color bbox coordinates, thermal temperatures, and confidence
 * - Geo position calculation using camera specs + GPS + IMU
 * - Collision warnings & Time-To-Collision (TTC) calculations
 * - Changing fog/visibility/weather dynamics
 * - Preset scenarios including SIH Presentation Demo
 */

import { db } from './db';
import { calculateCameraBearing, calculateEstimatedHazardPosition } from './geo';
import { evaluateHazardRisk } from './risk';
import { Hazard, Alert, Vehicle } from '../src/types';

export class SimulationEngine {
  private isRunning: boolean = true;
  private scenarioStep: number = 0;
  private currentScenario: string = 'SIH_PRESENTATION_DEMO'; // 'SIH_PRESENTATION_DEMO' | 'HAUL_ROAD_DUMPER' | 'BENCH_PIT_OBSTACLE' | 'THERMAL_HOTSPOT' | 'CONTINUOUS_RANDOM'
  private autoScenarioTimer: number = 0;

  // Haul road path waypoints around Bailadila Iron Ore Pit (Bench 4 to Crusher Ramp)
  private waypoints = [
    { lat: 18.675230, lon: 81.245120, heading: 72 },
    { lat: 18.675450, lon: 81.245800, heading: 68 },
    { lat: 18.675700, lon: 81.246400, heading: 55 },
    { lat: 18.676100, lon: 81.246800, heading: 40 },
    { lat: 18.676600, lon: 81.246900, heading: 10 },
    { lat: 18.677100, lon: 81.246600, heading: 330 },
    { lat: 18.677400, lon: 81.245900, heading: 290 },
    { lat: 18.677200, lon: 81.245100, heading: 240 },
    { lat: 18.676700, lon: 81.244400, heading: 210 },
    { lat: 18.675900, lon: 81.244200, heading: 150 },
    { lat: 18.675400, lon: 81.244600, heading: 110 },
  ];
  private currentWaypointIndex = 0;

  public setScenario(scenario: string) {
    this.currentScenario = scenario;
    this.scenarioStep = 0;
    this.autoScenarioTimer = 0;
    db.updateConfig({ simulationScenario: scenario });
    this.applyScenarioInitialState();
  }

  public setRunning(running: boolean) {
    this.isRunning = running;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getScenario(): string {
    return this.currentScenario;
  }

  public reset() {
    this.scenarioStep = 0;
    this.autoScenarioTimer = 0;
    this.applyScenarioInitialState();
  }

  private applyScenarioInitialState() {
    const vehicle = db.getVehicle('DUMPER-07');
    if (!vehicle) return;

    if (this.currentScenario === 'SIH_PRESENTATION_DEMO') {
      // SIH Presentation: Heavy fog, 3.4m visibility, speed 16 km/h, person approaching
      db.updateEnvironment({
        visibilityMeters: 3.4,
        visibilityStatus: 'CRITICAL',
        fogDensityPercent: 95,
        ambientTempC: 21.0,
        humidityPercent: 97,
        rainIntensityMmH: 16.0,
        recommendedSpeedKmh: 10,
      });

      vehicle.speedKmh = 16.0;
      vehicle.headingDeg = 72.0;
      vehicle.latitude = 18.675230;
      vehicle.longitude = 81.245120;
      vehicle.status = 'MOVING';
      db.updateVehicle(vehicle);

      // Create initial Hazard at 11.8m
      this.createOrUpdateHazard('HZ-PERSON-01', {
        type: 'PERSON',
        distanceM: 11.8,
        temperatureC: 36.9,
        confidence: 0.95,
        relativeBearingDeg: 12.0,
        pixelX: 380,
        pixelY: 260,
        bbox: [0.55, 0.45, 0.10, 0.26],
      });
    } else if (this.currentScenario === 'HAUL_ROAD_DUMPER') {
      db.updateEnvironment({
        visibilityMeters: 4.2,
        visibilityStatus: 'CRITICAL',
        fogDensityPercent: 91,
      });

      this.createOrUpdateHazard('HZ-DUMPER-02', {
        type: 'DUMPER',
        distanceM: 28.5,
        temperatureC: 78.4,
        confidence: 0.96,
        relativeBearingDeg: -18.0,
        pixelX: 210,
        pixelY: 240,
        bbox: [0.25, 0.35, 0.28, 0.38],
      });
    } else if (this.currentScenario === 'BENCH_PIT_OBSTACLE') {
      this.createOrUpdateHazard('HZ-ROCK-03', {
        type: 'OBSTACLE',
        distanceM: 8.2,
        temperatureC: 26.5,
        confidence: 0.92,
        relativeBearingDeg: 5.0,
        pixelX: 330,
        pixelY: 310,
        bbox: [0.46, 0.58, 0.16, 0.18],
      });
    } else if (this.currentScenario === 'THERMAL_HOTSPOT') {
      this.createOrUpdateHazard('HZ-HOTSPOT-04', {
        type: 'THERMAL_HOTSPOT',
        distanceM: 14.5,
        temperatureC: 92.4,
        confidence: 0.98,
        relativeBearingDeg: 22.0,
        pixelX: 450,
        pixelY: 280,
        bbox: [0.65, 0.48, 0.14, 0.20],
      });
    }
  }

  /**
   * Main simulation tick (called every 1000ms from server)
   */
  public tick() {
    if (!this.isRunning) return;

    // 1. Move the vehicle along the haul road
    this.updateVehicleMovement();

    // 2. Advance the scenario state
    this.advanceScenario();

    // 3. Modulate environmental fog/visibility slightly for realism
    this.modulateEnvironment();
  }

  private updateVehicleMovement() {
    const vehicle = db.getVehicle('DUMPER-07');
    if (!vehicle) return;

    if (vehicle.status === 'STOPPED') {
      vehicle.speedKmh = 0;
      db.updateVehicle(vehicle);
      return;
    }

    // Move towards current waypoint
    const targetWaypoint = this.waypoints[this.currentWaypointIndex];
    const dLat = targetWaypoint.lat - vehicle.latitude;
    const dLon = targetWaypoint.lon - vehicle.longitude;
    const distToWp = Math.sqrt(dLat * dLat + dLon * dLon);

    if (distToWp < 0.00015) {
      // Reached waypoint, advance to next
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    } else {
      // Smoothly steer towards waypoint
      const stepFactor = (vehicle.speedKmh / 3600) * 0.00015;
      vehicle.latitude += (dLat / distToWp) * stepFactor;
      vehicle.longitude += (dLon / distToWp) * stepFactor;
      
      // Interpolate heading
      const diffHeading = (targetWaypoint.heading - vehicle.headingDeg + 540) % 360 - 180;
      vehicle.headingDeg = (vehicle.headingDeg + diffHeading * 0.15 + 360) % 360;

      // Realistic bench vibrations (pitch/roll)
      vehicle.pitchDeg = Number((Math.sin(Date.now() / 800) * 1.8).toFixed(1));
      vehicle.rollDeg = Number((Math.cos(Date.now() / 950) * 1.2).toFixed(1));
    }

    vehicle.lastUpdated = new Date().toISOString();
    db.updateVehicle(vehicle);
  }

  private advanceScenario() {
    this.autoScenarioTimer++;

    if (this.currentScenario === 'SIH_PRESENTATION_DEMO') {
      // Step through the exact sequence from problem statement:
      // 11.8m (HIGH) -> 8.4m (HIGH) -> 5.2m (HIGH) -> 3.7m (CRITICAL COLLISION WARNING: REDUCE SPEED / STOP)
      const steps = [
        { dist: 11.8, temp: 36.9, conf: 0.95, bearing: 12.0, px: 380, py: 260 },
        { dist: 9.6,  temp: 37.2, conf: 0.96, bearing: 9.5,  px: 360, py: 275 },
        { dist: 8.4,  temp: 37.4, conf: 0.96, bearing: 7.0,  px: 345, py: 290 },
        { dist: 6.8,  temp: 37.7, conf: 0.97, bearing: 4.5,  px: 335, py: 310 },
        { dist: 5.2,  temp: 38.1, conf: 0.97, bearing: 2.0,  px: 325, py: 330 },
        { dist: 3.7,  temp: 38.6, conf: 0.98, bearing: -1.0, px: 315, py: 360 },
        { dist: 2.9,  temp: 38.8, conf: 0.99, bearing: -2.5, px: 310, py: 380 },
      ];

      const currentStepObj = steps[Math.min(this.scenarioStep, steps.length - 1)];

      this.createOrUpdateHazard('HZ-PERSON-01', {
        type: 'PERSON',
        distanceM: currentStepObj.dist,
        temperatureC: currentStepObj.temp,
        confidence: currentStepObj.conf,
        relativeBearingDeg: currentStepObj.bearing,
        pixelX: currentStepObj.px,
        pixelY: currentStepObj.py,
        bbox: [
          0.45 - (15 - currentStepObj.dist) * 0.01,
          0.35 + (15 - currentStepObj.dist) * 0.015,
          0.12 + (15 - currentStepObj.dist) * 0.008,
          0.28 + (15 - currentStepObj.dist) * 0.018,
        ],
      });

      // If at critical distance (< 4m), reduce vehicle speed or simulate emergency brake
      const vehicle = db.getVehicle('DUMPER-07');
      if (vehicle) {
        if (currentStepObj.dist <= 3.7) {
          vehicle.speedKmh = Math.max(0, vehicle.speedKmh - 4.5);
          if (vehicle.speedKmh === 0) {
            vehicle.status = 'STOPPED';
          }
        } else {
          vehicle.speedKmh = 16.0;
          vehicle.status = 'MOVING';
        }
        db.updateVehicle(vehicle);
      }

      // Advance step every 2 seconds
      if (this.autoScenarioTimer % 2 === 0) {
        this.scenarioStep = (this.scenarioStep + 1) % (steps.length + 3);
        if (this.scenarioStep >= steps.length) {
          // Pause then loop back to starting distance for continuous presentation
          if (this.scenarioStep === steps.length + 2) {
            this.scenarioStep = 0;
          }
        }
      }
    } else if (this.currentScenario === 'CONTINUOUS_RANDOM') {
      // Dynamic random wandering
      const hazards = db.getHazards();
      for (const h of hazards) {
        h.distanceM = Math.max(2.5, Number((h.distanceM + (Math.random() - 0.52) * 0.8).toFixed(1)));
        this.createOrUpdateHazard(h.id, {
          type: h.type,
          distanceM: h.distanceM,
          temperatureC: h.temperatureC,
          confidence: h.confidence,
          relativeBearingDeg: h.bearingDeg,
          pixelX: h.pixelX,
          pixelY: h.pixelY,
          bbox: h.bbox,
        });
      }
    }
  }

  private createOrUpdateHazard(
    hazardId: string,
    params: {
      type: Hazard['type'];
      distanceM: number;
      temperatureC: number;
      confidence: number;
      relativeBearingDeg: number;
      pixelX: number;
      pixelY: number;
      bbox: [number, number, number, number];
    }
  ) {
    const vehicle = db.getVehicle('DUMPER-07');
    if (!vehicle) return;

    const env = db.getEnvironment();
    const config = db.getConfig();

    // 1. Calculate Geolocation position
    const geo = calculateEstimatedHazardPosition(
      vehicle.latitude,
      vehicle.longitude,
      vehicle.headingDeg,
      params.relativeBearingDeg,
      params.distanceM
    );

    // 2. Evaluate Risk & TTC
    const risk = evaluateHazardRisk(
      params.distanceM,
      params.type,
      params.relativeBearingDeg,
      vehicle.speedKmh,
      env.visibilityMeters,
      params.temperatureC,
      config.dangerZones
    );

    const existing = db.getHazard(hazardId);
    const now = new Date().toISOString();

    const hazard: Hazard = {
      id: hazardId,
      type: params.type,
      confidence: params.confidence,
      temperatureC: params.temperatureC,
      distanceM: params.distanceM,
      bearingDeg: Number(params.relativeBearingDeg.toFixed(1)),
      pixelX: params.pixelX,
      pixelY: params.pixelY,
      bbox: params.bbox,
      latitude: geo.latitude,
      longitude: geo.longitude,
      riskLevel: risk.riskLevel,
      dangerZone: risk.dangerZone,
      timeToCollisionSec: risk.timeToCollisionSec,
      timestamp: now,
      source: 'THERMAL_LWIR + 77GHz_RADAR',
      isEstimatedPosition: true,
      status: 'ACTIVE',
      firstDetected: existing ? existing.firstDetected : now,
      lastDetected: now,
      recommendedAction: risk.recommendedAction,
      trackingCount: existing ? existing.trackingCount + 1 : 1,
    };

    db.setHazard(hazard);

    // Trigger Alert if needed
    if (risk.isImmediateAlert) {
      const alertSeverity = risk.riskLevel === 'CRITICAL' ? 'CRITICAL' : risk.riskLevel === 'HIGH' ? 'HIGH' : 'WARNING';
      db.addAlert({
        id: `ALT-${Date.now()}-${hazard.id.slice(-4)}`,
        severity: alertSeverity,
        title: risk.riskLevel === 'CRITICAL' 
          ? `⚠ CRITICAL COLLISION WARNING — ${hazard.type}` 
          : `Hazard Approaching: ${hazard.type}`,
        message: `${hazard.type} detected at ${hazard.distanceM}m (${risk.dangerZone} ZONE) — ${risk.timeToCollisionSec ? `TTC: ${risk.timeToCollisionSec}s` : 'Direct Path'}`,
        distanceM: hazard.distanceM,
        timestamp: now,
        acknowledged: false,
        dismissed: false,
        hazardId: hazard.id,
        vehicleId: vehicle.id,
        actionRequired: risk.recommendedAction,
      });
    }
  }

  private modulateEnvironment() {
    const env = db.getEnvironment();
    // Subtle realistic fog fluctuation between 3.2m and 4.8m in Bailadila pit
    const delta = (Math.random() - 0.5) * 0.1;
    const newVis = Math.max(2.8, Math.min(6.5, Number((env.visibilityMeters + delta).toFixed(1))));
    
    let status: 'CRITICAL' | 'POOR' | 'MODERATE' | 'GOOD' = 'CRITICAL';
    if (newVis < 5.0) status = 'CRITICAL';
    else if (newVis < 10.0) status = 'POOR';
    else if (newVis < 20.0) status = 'MODERATE';
    else status = 'GOOD';

    db.updateEnvironment({
      visibilityMeters: newVis,
      visibilityStatus: status,
      fogDensityPercent: Math.min(99, Math.max(80, Math.round(100 - (newVis / 20) * 40))),
    });
  }
}

export const simulator = new SimulationEngine();
