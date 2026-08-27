import React from 'react';
import {
  AlertOctagon,
  Navigation2,
  MapPin,
  CheckCheck,
  ShieldAlert,
  Volume2,
  ArrowRight,
  Flame,
  Radio,
  Eye,
} from 'lucide-react';
import { Hazard } from '../../types';
import { soundManager } from '../../services/audio';

interface CriticalAlertOverlayProps {
  hazard: Hazard | null;
  onAcknowledge: (hazardId: string) => void;
  onInspect: (hazardId: string) => void;
}

export const CriticalAlertOverlay: React.FC<CriticalAlertOverlayProps> = ({
  hazard,
  onAcknowledge,
  onInspect,
}) => {
  if (!hazard) return null;

  const isCritical =
    hazard.riskLevel === 'CRITICAL' ||
    hazard.dangerZone === 'CRITICAL' ||
    hazard.distanceM <= 5.0;

  if (!isCritical) return null;

  const getDirectionText = (bearing: number) => {
    if (bearing >= -15 && bearing <= 15) return 'DIRECT FRONT (12 O\'CLOCK)';
    if (bearing > 15 && bearing <= 45) return 'FRONT-RIGHT (1-2 O\'CLOCK)';
    if (bearing > 45 && bearing <= 100) return 'STARBOARD / RIGHT (3 O\'CLOCK)';
    if (bearing > 100) return 'REAR-RIGHT (4-5 O\'CLOCK)';
    if (bearing < -15 && bearing >= -45) return 'FRONT-LEFT (10-11 O\'CLOCK)';
    if (bearing < -45 && bearing >= -100) return 'PORT / LEFT (9 O\'CLOCK)';
    return 'REAR-LEFT (7-8 O\'CLOCK)';
  };

  const handleAcknowledge = () => {
    soundManager.acknowledgeHazard(hazard.id);
    onAcknowledge(hazard.id);
  };

  return (
    <div
      id="critical-alert-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-2xl bg-[#0a0507] border-2 border-red-600 chamfer-md shadow-[0_0_50px_rgba(239,68,68,0.55)] overflow-hidden flex flex-col">
        {/* Top Warning Banner / Hazard Stripes */}
        <div className="hazard-stripes-red py-2.5 px-4 flex items-center justify-between border-b-2 border-red-600">
          <div className="flex items-center gap-2 text-white">
            <AlertOctagon className="w-6 h-6 text-white animate-bounce shrink-0" />
            <span className="font-heading font-black text-sm sm:text-base uppercase tracking-widest drop-shadow">
              🔴 CRITICAL HAZARD PROXIMITY INTERLOCK
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-black/80 text-red-300 font-mono text-[10px] font-black border border-red-500/70 chamfer-sm">
            <Volume2 className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span>ALARM REPEATING</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Main Action Callout */}
          <div className="bg-red-950/70 border-2 border-red-500/80 p-4 chamfer-sm text-center shadow-inner">
            <div className="text-[11px] font-mono font-black text-red-300 uppercase tracking-wider mb-1">
              MANDATORY OPERATOR ACTION
            </div>
            <div className="text-xl sm:text-2xl font-heading font-black text-white tracking-wide uppercase animate-pulse">
              ⚠ {hazard.recommendedAction || 'STOP VEHICLE IMMEDIATELY / APPLY EMERGENCY BRAKE'}
            </div>
          </div>

          {/* Grid of Hazard Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {/* 1. Hazard Type */}
            <div className="bg-[#080b10] border border-[#1c2638] p-3 chamfer-sm">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">1. HAZARD TYPE</span>
              <div className="text-base font-black text-white font-heading mt-0.5 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs chamfer-sm">
                  {hazard.type}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Confidence: {Math.round(hazard.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* 2. Distance */}
            <div className="bg-[#080b10] border border-red-600/50 p-3 chamfer-sm shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">2. CRITICAL DISTANCE</span>
              <div className="text-2xl font-black text-red-400 mt-0.5 flex items-baseline gap-1">
                {hazard.distanceM.toFixed(1)} <span className="text-sm font-bold text-zinc-400">METERS</span>
                {hazard.timeToCollisionSec !== null && (
                  <span className="text-xs text-amber-300 ml-auto font-bold">
                    TTC: {hazard.timeToCollisionSec.toFixed(1)}s
                  </span>
                )}
              </div>
            </div>

            {/* 3. Direction */}
            <div className="bg-[#080b10] border border-[#1c2638] p-3 chamfer-sm">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">3. BEARING / DIRECTION</span>
              <div className="text-sm font-bold text-amber-300 mt-1 flex items-center gap-2">
                <Navigation2
                  className="w-4 h-4 text-red-400 shrink-0"
                  style={{ transform: `rotate(${hazard.bearingDeg}deg)` }}
                />
                <span>
                  {getDirectionText(hazard.bearingDeg)} ({hazard.bearingDeg > 0 ? `+${hazard.bearingDeg}` : hazard.bearingDeg}°)
                </span>
              </div>
            </div>

            {/* 4. Estimated Position */}
            <div className="bg-[#080b10] border border-[#1c2638] p-3 chamfer-sm">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">4. ESTIMATED POSITION (GIS)</span>
              <div className="text-xs text-zinc-200 mt-1 flex items-center gap-1.5 font-mono">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {hazard.latitude.toFixed(6)}°N, {hazard.longitude.toFixed(6)}°E
                </span>
              </div>
              <div className="text-[9px] text-zinc-500 mt-0.5">
                ESTIMATED FROM TRUCK ODOMETRY + SENSOR RANGE
              </div>
            </div>
          </div>

          {/* Sensor Diagnostics Line */}
          <div className="bg-[#05070a] border border-[#162032] px-3.5 py-2 chamfer-sm flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-purple-300">
              <Flame className="w-3.5 h-3.5" />
              <span>LWIR THERMAL: <strong>{hazard.temperatureC.toFixed(1)}°C</strong></span>
            </div>
            <div className="text-zinc-400 text-[10px]">
              SOURCE: <strong className="text-zinc-200">{hazard.source}</strong>
            </div>
            <div className="text-amber-400 text-[10px] flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>AUDIO ALARM LOOP ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#080406] border-t border-[#231218] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-mono text-zinc-500">
            Pressing Acknowledge silences this hazard's repeating audio loop until new critical hazards emerge.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onInspect(hazard.id)}
              className="px-4 py-2 bg-[#162032] hover:bg-[#202d44] border border-[#2b3c58] text-white font-mono font-bold text-xs uppercase chamfer-sm flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>VIEW IN MAP</span>
            </button>

            <button
              id="acknowledge-critical-hazard-btn"
              onClick={handleAcknowledge}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-heading font-black text-xs sm:text-sm uppercase tracking-wider chamfer-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              <span>ACKNOWLEDGE &amp; SILENCE ALARM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
