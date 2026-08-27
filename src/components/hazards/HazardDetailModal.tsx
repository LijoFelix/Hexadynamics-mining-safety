import React from 'react';
import {
  X,
  Crosshair,
  AlertTriangle,
  Flame,
  Navigation,
  Activity,
  Cpu,
  MapPin,
  Clock,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Hazard } from '../../types';

interface HazardDetailModalProps {
  hazard: Hazard | null;
  onClose: () => void;
  onCenterMap: (lat: number, lon: number) => void;
}

export const HazardDetailModal: React.FC<HazardDetailModalProps> = ({
  hazard,
  onClose,
  onCenterMap,
}) => {
  if (!hazard) return null;

  const isCritical = hazard.riskLevel === 'CRITICAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="tech-panel chamfer-md w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-[#1c2638]">
        {/* Modal Header */}
        <div
          className={`px-4 py-3 flex items-center justify-between border-b ${
            isCritical
              ? 'bg-[#22070a] border-red-700/80 text-red-100'
              : 'bg-[#0b0f17] border-[#1c2638] text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 chamfer-sm ${
                isCritical ? 'bg-red-600 text-white' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black font-heading uppercase tracking-wider">
                HAZARD INSPECTOR: {hazard.id}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                TELEMETRY SOURCE: [{hazard.source}]
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 chamfer-sm text-zinc-400 hover:text-white hover:bg-[#162032] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto max-h-[75vh] bg-[#05070a]">
          {/* Main Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#080b10] p-2.5 chamfer-sm border border-[#161f2e] font-mono">
              <span className="text-[9px] text-zinc-500 block uppercase font-bold">TYPE</span>
              <span className="text-sm font-black text-white font-heading">{hazard.type}</span>
            </div>

            <div className="bg-[#080b10] p-2.5 chamfer-sm border border-[#161f2e] font-mono">
              <span className="text-[9px] text-zinc-500 block uppercase font-bold">RISK</span>
              <span
                className={`text-sm font-black ${
                  hazard.riskLevel === 'CRITICAL'
                    ? 'text-red-400'
                    : hazard.riskLevel === 'HIGH'
                    ? 'text-orange-400'
                    : 'text-amber-400'
                }`}
              >
                {hazard.riskLevel}
              </span>
            </div>

            <div className="bg-[#080b10] p-2.5 chamfer-sm border border-[#161f2e] font-mono">
              <span className="text-[9px] text-zinc-500 block uppercase font-bold">DISTANCE</span>
              <span className="text-sm font-black text-white">{hazard.distanceM.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">m</span></span>
            </div>

            <div className="bg-[#080b10] p-2.5 chamfer-sm border border-[#161f2e] font-mono">
              <span className="text-[9px] text-zinc-500 block uppercase font-bold">TEMPERATURE</span>
              <span className="text-sm font-black text-purple-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                {hazard.temperatureC.toFixed(1)}°C
              </span>
            </div>
          </div>

          {/* Detailed Geolocation Calculation Breakdown */}
          <div className="bg-[#080b10] p-3 chamfer-sm border border-[#161f2e] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300 font-mono">
              <span className="flex items-center gap-1.5 font-heading text-white">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                ESTIMATED HAZARD GEOLOCATION &amp; BEARING
              </span>
              <span className="text-[9px] px-1.5 py-0.5 chamfer-sm bg-[#121926] text-amber-300 border border-[#243147] font-bold font-mono">
                HAVERSINE ESTIMATION
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#05070a] p-2 chamfer-sm border border-[#161f2e]">
                <span className="text-[9px] text-zinc-500 block font-bold">ESTIMATED LATITUDE</span>
                <span className="text-zinc-100 font-bold">{hazard.latitude.toFixed(6)}° N</span>
              </div>
              <div className="bg-[#05070a] p-2 chamfer-sm border border-[#161f2e]">
                <span className="text-[9px] text-zinc-500 block font-bold">ESTIMATED LONGITUDE</span>
                <span className="text-zinc-100 font-bold">{hazard.longitude.toFixed(6)}° E</span>
              </div>
              <div className="bg-[#05070a] p-2 chamfer-sm border border-[#161f2e]">
                <span className="text-[9px] text-zinc-500 block font-bold">RELATIVE BEARING</span>
                <span className="text-amber-300 font-bold">{hazard.bearingDeg > 0 ? `+${hazard.bearingDeg}` : hazard.bearingDeg}° FROM BOW</span>
              </div>
              <div className="bg-[#05070a] p-2 chamfer-sm border border-[#161f2e]">
                <span className="text-[9px] text-zinc-500 block font-bold">PIXEL CENTROID (U, V)</span>
                <span className="text-zinc-100 font-bold">X: {hazard.pixelX}px | Y: {hazard.pixelY}px</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 bg-[#05070a] p-2.5 chamfer-sm border border-[#161f2e] font-mono">
              <div className="text-zinc-200 font-bold mb-1 text-[10px] uppercase tracking-wider">Position Estimation Pipeline:</div>
              <div className="text-[10px] text-zinc-400 leading-relaxed">
                1. Thermal LWIR Pixel (u,v) → Scaled Camera Matrix (50.0° HFOV) → Relative Azimuth: <strong className="text-amber-300">{hazard.bearingDeg}°</strong><br />
                2. Vehicle GPS Base (18.675230, 81.245120) + Gyro Heading + Azimuth + Distance ({hazard.distanceM}m) → <strong className="text-emerald-300">WGS-84 Coordinate</strong>
              </div>
            </div>
          </div>

          {/* Recommended Operator Action */}
          <div className="bg-[#181006] border border-amber-500/50 p-3 chamfer-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-black font-heading text-amber-300 uppercase tracking-wider">
                RECOMMENDED OPERATOR ACTION:
              </div>
              <div className="text-xs text-amber-100 font-medium mt-0.5 leading-relaxed font-body">
                {hazard.recommendedAction}
              </div>
            </div>
          </div>

          {/* Time & Telemetry Meta */}
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-1">
            <span className="flex items-center gap-1 text-[10px]">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              FIRST DETECTED: {new Date(hazard.firstDetected).toLocaleTimeString()}
            </span>
            <span className="text-[10px] font-bold text-zinc-400">TRACK CYCLES: {hazard.trackingCount}</span>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="px-4 py-3 bg-[#0b0f17] border-t border-[#1c2638] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 chamfer-sm text-xs font-bold font-mono bg-[#121926] text-zinc-300 hover:bg-[#1a2538] border border-[#243147] transition-colors"
          >
            DISMISS
          </button>
          <button
            onClick={() => {
              onCenterMap(hazard.latitude, hazard.longitude);
              onClose();
            }}
            className="px-4 py-1.5 chamfer-sm text-xs font-black font-mono bg-amber-500 hover:bg-amber-400 text-black transition-colors flex items-center gap-1.5 shadow"
          >
            <Crosshair className="w-4 h-4" />
            <span>TRACK ON GIS MAP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
