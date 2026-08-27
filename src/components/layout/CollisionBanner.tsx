import React from 'react';
import { AlertOctagon, Navigation2, Zap, ArrowRight } from 'lucide-react';
import { Hazard } from '../../types';

interface CollisionBannerProps {
  hazards: Hazard[];
  onSelectHazard: (id: string) => void;
  onCenterMap: (lat: number, lon: number) => void;
}

export const CollisionBanner: React.FC<CollisionBannerProps> = ({
  hazards,
  onSelectHazard,
  onCenterMap,
}) => {
  // Find most critical hazard
  const criticalHazard = hazards.find(
    (h) => h.riskLevel === 'CRITICAL' || (h.distanceM <= 5.0 && h.status === 'ACTIVE')
  );

  const highHazard = !criticalHazard
    ? hazards.find((h) => h.riskLevel === 'HIGH' && h.status === 'ACTIVE')
    : null;

  const targetHazard = criticalHazard || highHazard;

  if (!targetHazard) return null;

  const isCritical = targetHazard.riskLevel === 'CRITICAL' || targetHazard.distanceM <= 5.0;

  // Direction label from bearing
  const getDirectionText = (bearing: number) => {
    if (bearing >= -15 && bearing <= 15) return 'Direct Front';
    if (bearing > 15 && bearing <= 45) return 'Front-Right';
    if (bearing > 45) return 'Far-Right';
    if (bearing < -15 && bearing >= -45) return 'Front-Left';
    return 'Far-Left';
  };

  return (
    <div
      className={`px-4 py-2.5 border-b border-t transition-all duration-300 relative overflow-hidden ${
        isCritical
          ? 'bg-[#18080a] border-red-500/80 hazard-stripes-red animate-pulse-critical shadow-[0_0_25px_rgba(239,68,68,0.3)]'
          : 'bg-[#1a1208] border-amber-500/80 hazard-stripes-amber'
      }`}
    >
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3 relative z-10">
        {/* Left Warning Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 chamfer-sm flex items-center justify-center shrink-0 shadow-lg ${
              isCritical ? 'bg-red-600 text-white animate-bounce' : 'bg-amber-500 text-zinc-950 font-black'
            }`}
          >
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black tracking-wide text-xs sm:text-sm uppercase text-white">
                {isCritical ? 'CRITICAL PROXIMITY INTERLOCK ACTIVE' : 'HIGH PROXIMITY HAZARD DETECTED'}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-[#080b10] text-amber-400 font-mono font-bold uppercase border border-amber-500/40 chamfer-sm">
                TARGET: {targetHazard.type}
              </span>
            </div>
            <div className="text-xs font-body font-medium text-amber-200 mt-0.5">
              <strong className="font-mono text-white mr-1.5">[MANDATORY ACTION]</strong>
              {targetHazard.recommendedAction}
            </div>
          </div>
        </div>

        {/* Center Telemetry Readout */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="bg-[#080b10] px-3 py-1 chamfer-sm border border-[#232f44]">
            <span className="text-zinc-500 block text-[9px] uppercase font-bold">RANGE</span>
            <span className={`text-base font-black ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
              {targetHazard.distanceM.toFixed(1)} <span className="text-xs text-zinc-400">m</span>
            </span>
          </div>

          <div className="bg-[#080b10] px-3 py-1 chamfer-sm border border-[#232f44]">
            <span className="text-zinc-500 block text-[9px] uppercase font-bold">REL BEARING</span>
            <span className="text-sm font-bold text-white flex items-center gap-1">
              <Navigation2 className="w-3.5 h-3.5 inline text-amber-400" style={{ transform: `rotate(${targetHazard.bearingDeg}deg)` }} />
              {getDirectionText(targetHazard.bearingDeg)} ({targetHazard.bearingDeg > 0 ? `+${targetHazard.bearingDeg}` : targetHazard.bearingDeg}°)
            </span>
          </div>

          {targetHazard.timeToCollisionSec !== null && (
            <div className="bg-[#080b10] px-3 py-1 chamfer-sm border border-[#232f44]">
              <span className="text-zinc-500 block text-[9px] uppercase font-bold">TIME TO COLLISION</span>
              <span className={`text-base font-black ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                {targetHazard.timeToCollisionSec.toFixed(1)} <span className="text-xs text-zinc-400">s</span>
              </span>
            </div>
          )}

          <div className="bg-[#080b10] px-3 py-1 chamfer-sm border border-[#232f44] hidden md:block">
            <span className="text-zinc-500 block text-[9px] uppercase font-bold">LWIR TEMP</span>
            <span className="text-sm font-bold text-purple-300">{targetHazard.temperatureC.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onSelectHazard(targetHazard.id);
              onCenterMap(targetHazard.latitude, targetHazard.longitude);
            }}
            className="px-3.5 py-1.5 chamfer-sm text-xs font-heading font-black tracking-wider bg-white text-zinc-950 hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-md uppercase"
          >
            <span>INSPECT TARGET</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
