/**
 * Risk Engine & Collision Prediction Module
 * 
 * Computes Risk Level (CRITICAL, HIGH, MEDIUM, LOW) and Time-To-Collision (TTC)
 * based on distance, object type, vehicle speed, heading relative to object, and environmental visibility.
 */

import { ObjectType, RiskLevel } from '../src/types';

export interface DangerZoneConfig {
  critical: number; // 0 to 5m default
  danger: number;   // 5 to 15m default
  warning: number;  // 15 to 30m default
}

export const DEFAULT_DANGER_ZONES: DangerZoneConfig = {
  critical: 5.0,
  danger: 15.0,
  warning: 30.0,
};

export interface RiskEvaluationResult {
  riskLevel: RiskLevel;
  dangerZone: 'CRITICAL' | 'DANGER' | 'WARNING' | 'SAFE';
  timeToCollisionSec: number | null;
  recommendedAction: string;
  isImmediateAlert: boolean;
}

export function evaluateHazardRisk(
  distanceMeters: number,
  objectType: ObjectType,
  relativeBearingDeg: number,
  vehicleSpeedKmh: number,
  visibilityMeters: number,
  temperatureC: number,
  zones: DangerZoneConfig = DEFAULT_DANGER_ZONES
): RiskEvaluationResult {
  // Convert vehicle speed to m/s
  const vehicleSpeedMs = (vehicleSpeedKmh * 1000) / 3600;

  // Factor in relative direction: objects straight ahead (near 0 bearing) have higher collision vector
  const bearingRad = (Math.abs(relativeBearingDeg) * Math.PI) / 180;
  const forwardVelocityComponent = vehicleSpeedMs * Math.cos(bearingRad);

  let timeToCollisionSec: number | null = null;
  if (forwardVelocityComponent > 0.5 && distanceMeters > 0) {
    timeToCollisionSec = Number((distanceMeters / forwardVelocityComponent).toFixed(1));
  }

  // Zone classification
  let dangerZone: 'CRITICAL' | 'DANGER' | 'WARNING' | 'SAFE' = 'SAFE';
  if (distanceMeters <= zones.critical) {
    dangerZone = 'CRITICAL';
  } else if (distanceMeters <= zones.danger) {
    dangerZone = 'DANGER';
  } else if (distanceMeters <= zones.warning) {
    dangerZone = 'WARNING';
  } else {
    dangerZone = 'SAFE';
  }

  // Determine Risk Level based on distance, object type, visibility, and thermal hotspot
  let riskLevel: RiskLevel = 'LOW';
  let recommendedAction = 'MONITOR / PROCEED WITH CAUTION';
  let isImmediateAlert = false;

  // Humans have higher vulnerability priority
  const isHuman = objectType === 'PERSON';
  const isHeavyMachinery = objectType === 'DUMPER' || objectType === 'EXCAVATOR' || objectType === 'TRUCK';
  const isThermalSpike = temperatureC > 65.0 || objectType === 'THERMAL_HOTSPOT';

  // Fog visibility penalty: if visibility is lower than distance, risk escalates because operator cannot see with eyes
  const isBlindToDriver = distanceMeters >= visibilityMeters;

  if (dangerZone === 'CRITICAL' || (timeToCollisionSec !== null && timeToCollisionSec <= 2.5)) {
    riskLevel = 'CRITICAL';
    recommendedAction = isHuman 
      ? 'EMERGENCY BRAKE / STOP IMMEDIATELY — PERSON IN CRITICAL PROXIMITY'
      : 'EMERGENCY BRAKE / STOP IMMEDIATELY — IMMINENT COLLISION';
    isImmediateAlert = true;
  } else if (dangerZone === 'DANGER' || (timeToCollisionSec !== null && timeToCollisionSec <= 5.0) || (isHuman && distanceMeters <= 18)) {
    riskLevel = 'HIGH';
    recommendedAction = isHuman
      ? 'REDUCE SPEED (≤10 km/h) & SOUND HORN — PEDESTRIAN DETECTED'
      : 'REDUCE SPEED & MAINTAIN HAUL DISTANCE';
    isImmediateAlert = true;
  } else if (dangerZone === 'WARNING' || isBlindToDriver || isThermalSpike) {
    riskLevel = 'MEDIUM';
    recommendedAction = isThermalSpike
      ? 'WARNING: THERMAL ANOMALY DETECTED — INSPECT PIT EQUIPMENT'
      : 'ADJUST SPEED FOR LOW VISIBILITY — OBJECT IN WARNING ZONE';
    isImmediateAlert = isThermalSpike || isHuman;
  } else {
    riskLevel = 'LOW';
    recommendedAction = 'CLEAR PATH — CONTINUE AT SAFE BENCH SPEED';
  }

  return {
    riskLevel,
    dangerZone,
    timeToCollisionSec,
    recommendedAction,
    isImmediateAlert,
  };
}
