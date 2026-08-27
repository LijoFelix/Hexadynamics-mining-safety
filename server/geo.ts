/**
 * Geolocation & Hazard Positioning Module
 * 
 * Calculates estimated geographic position (Latitude, Longitude) for detected hazards
 * based on vehicle GPS, IMU orientation, camera intrinsic parameters, and distance sensor.
 */

export interface CameraSpecs {
  horizontalFOV: number; // in degrees, e.g. 50 deg for thermal lens
  verticalFOV: number;   // in degrees, e.g. 38 deg
  imageWidth: number;    // in pixels, e.g. 640
  imageHeight: number;   // in pixels, e.g. 480
}

export const DEFAULT_THERMAL_SPECS: CameraSpecs = {
  horizontalFOV: 50.0,
  verticalFOV: 38.0,
  imageWidth: 640,
  imageHeight: 480,
};

/**
 * Calculates the relative bearing (in degrees, -FOV/2 to +FOV/2) from pixel coordinates
 */
export function calculateCameraBearing(
  pixelX: number,
  pixelY: number,
  specs: CameraSpecs = DEFAULT_THERMAL_SPECS
): { bearingDeg: number; elevationDeg: number } {
  // Normalize pixel coordinates from center (-1 to +1)
  const normalizedX = (pixelX - specs.imageWidth / 2) / (specs.imageWidth / 2);
  const normalizedY = (specs.imageHeight / 2 - pixelY) / (specs.imageHeight / 2);

  const bearingDeg = normalizedX * (specs.horizontalFOV / 2);
  const elevationDeg = normalizedY * (specs.verticalFOV / 2);

  return { bearingDeg, elevationDeg };
}

/**
 * Calculates estimated geographic position given vehicle GPS, heading, relative bearing, and distance
 * Uses spherical Earth geodesy (Haversine destination formula)
 */
export function calculateEstimatedHazardPosition(
  vehicleLat: number,
  vehicleLon: number,
  vehicleHeadingDeg: number,
  relativeBearingDeg: number,
  distanceMeters: number
): { latitude: number; longitude: number; absoluteBearingDeg: number } {
  // Absolute bearing in degrees (0 to 360)
  const absoluteBearingDeg = (vehicleHeadingDeg + relativeBearingDeg + 360) % 360;
  const bearingRad = (absoluteBearingDeg * Math.PI) / 180;

  const latRad = (vehicleLat * Math.PI) / 180;
  const lonRad = (vehicleLon * Math.PI) / 180;

  const EARTH_RADIUS_METERS = 6371000;
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;

  // Destination latitude
  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  // Destination longitude
  const destLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
    Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLatRad)
  );

  const latitude = (destLatRad * 180) / Math.PI;
  const longitude = (destLonRad * 180) / Math.PI;

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
    absoluteBearingDeg: Number(absoluteBearingDeg.toFixed(1)),
  };
}

/**
 * Calculates distance between two GPS coordinates in meters
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}
