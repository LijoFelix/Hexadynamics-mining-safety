import React from 'react';
import { CloudFog, Droplets, Thermometer, Wind, Gauge, AlertCircle } from 'lucide-react';
import { EnvironmentState } from '../../types';

interface FogMonitorProps {
  environment: EnvironmentState | null;
  className?: string;
}

export const FogMonitor: React.FC<FogMonitorProps> = ({ environment, className = '' }) => {
  const visibility = environment?.visibilityMeters ?? 3.8;
  const fogDensity = environment?.fogDensityPercent ?? 94;
  const humidity = environment?.humidityPercent ?? 96;
  const temp = environment?.ambientTempC ?? 21.4;
  const rain = environment?.rainIntensityMmH ?? 14.5;
  const recSpeed = environment?.recommendedSpeedKmh ?? 10;
  const location = environment?.benchLocation ?? 'Bench #04 - South Pit';

  const isCritical = visibility < 5.0;

  // Calculate visual block bar
  const totalBlocks = 18;
  const filledBlocks = Math.round((fogDensity / 100) * totalBlocks);
  const blockString = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

  return (
    <div className={`tech-panel chamfer-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#0b0f17] border-b border-[#1c2638] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-sky-500/20 border border-sky-500/40 chamfer-sm text-sky-400">
            <CloudFog className="w-3.5 h-3.5" />
          </div>
          <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
            ATMOSPHERIC &amp; FOG SENSOR SUITE
          </span>
        </div>
        <span
          className={`px-2 py-0.5 chamfer-sm text-[9px] font-mono font-bold uppercase ${
            isCritical
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}
        >
          {isCritical ? 'CRITICAL OBSCURATION' : 'POOR VISIBILITY'}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
        {/* Fog Level Block Meter */}
        <div className="bg-[#080b10] p-2.5 chamfer-sm border border-[#161f2e]">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">FOG DENSITY SATURATION:</span>
            <span className="text-red-400 font-black text-sm">{fogDensity}%</span>
          </div>
          <div className="font-mono text-sm tracking-tighter text-sky-400 select-none overflow-hidden text-ellipsis whitespace-nowrap">
            {blockString}
          </div>
        </div>

        {/* Environmental Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono">
          <div className="bg-[#080b10] p-2 chamfer-sm border border-[#161f2e]">
            <div className="text-[9px] text-zinc-500 flex items-center gap-1 uppercase font-bold">
              <CloudFog className="w-3 h-3 text-sky-400" />
              Optical Range
            </div>
            <div className="text-base font-black text-white mt-0.5">{visibility.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">m</span></div>
          </div>

          <div className="bg-[#080b10] p-2 chamfer-sm border border-[#161f2e]">
            <div className="text-[9px] text-zinc-500 flex items-center gap-1 uppercase font-bold">
              <Droplets className="w-3 h-3 text-sky-400" />
              Humidity
            </div>
            <div className="text-base font-black text-white mt-0.5">{humidity} <span className="text-xs text-zinc-500 font-normal">%</span></div>
          </div>

          <div className="bg-[#080b10] p-2 chamfer-sm border border-[#161f2e]">
            <div className="text-[9px] text-zinc-500 flex items-center gap-1 uppercase font-bold">
              <Thermometer className="w-3 h-3 text-amber-400" />
              Ambient Temp
            </div>
            <div className="text-base font-black text-white mt-0.5">{temp.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">°C</span></div>
          </div>

          <div className="bg-[#080b10] p-2 chamfer-sm border border-[#161f2e]">
            <div className="text-[9px] text-zinc-500 flex items-center gap-1 uppercase font-bold">
              <Wind className="w-3 h-3 text-teal-400" />
              Precipitation
            </div>
            <div className="text-base font-black text-white mt-0.5">{rain} <span className="text-xs text-zinc-500 font-normal">mm/h</span></div>
          </div>
        </div>

        {/* Recommended Speed Advisory */}
        <div className="bg-[#181106] border border-amber-500/40 p-2.5 chamfer-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-amber-500/20 border border-amber-500/40 chamfer-sm text-amber-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] font-mono text-zinc-400 uppercase font-bold">
                SPEED INTERLOCK ADVISORY:
              </div>
              <div className="text-sm font-black font-mono text-amber-300">
                ≤ {recSpeed} KM/H (HEMM MAX PERMITTED)
              </div>
            </div>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono text-right max-w-[140px] truncate font-bold">
            {location}
          </span>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="px-3 py-1 bg-[#080b10] border-t border-[#1c2638] text-[9px] text-zinc-400 font-mono">
        Speed recommendations are prototype safety algorithms and not certified statutory mine limits.
      </div>
    </div>
  );
};
