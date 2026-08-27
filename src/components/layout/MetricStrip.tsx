import React from 'react';
import { Eye, AlertCircle, Gauge, Navigation, Flame, Target } from 'lucide-react';
import { DashboardStats, EnvironmentState } from '../../types';

interface MetricStripProps {
  stats: DashboardStats | null;
  environment: EnvironmentState | null;
}

export const MetricStrip: React.FC<MetricStripProps> = ({ stats, environment }) => {
  const visibility = environment?.visibilityMeters ?? stats?.visibilityMeters ?? 3.8;
  const visibilityStatus = environment?.visibilityStatus ?? (visibility < 5 ? 'CRITICAL' : 'POOR');
  const activeHazards = stats?.activeHazardsCount ?? 0;
  const speed = stats?.vehicleSpeedKmh ?? 16;
  const nearestHazard = stats?.nearestHazardMeters;
  const maxTemp = stats?.maxThermalTempC ?? 38.6;
  const confidence = stats?.detectionConfidenceAvg ?? 94.2;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 bg-[#080b10] border-b border-[#1c2638]">
      {/* 1. Visibility Metric */}
      <div className="tech-panel p-2.5 flex flex-col justify-between chamfer-sm corner-crosshairs relative overflow-hidden group hover:border-[#2b3a54] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span className="font-heading font-extrabold uppercase tracking-wider text-[11px] text-zinc-300">
            VISIBILITY RANGE
          </span>
          <Eye className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-1">
          <span className="text-3xl font-mono font-black tracking-tight text-white">{visibility.toFixed(1)}</span>
          <span className="text-xs font-mono text-zinc-400 font-bold">m</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-[#161f2e]">
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 uppercase chamfer-sm ${
              visibilityStatus === 'CRITICAL'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {visibilityStatus}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">FOG: {environment?.fogDensityPercent ?? 94}%</span>
        </div>
      </div>

      {/* 2. Active Hazards */}
      <div className="tech-panel p-2.5 flex flex-col justify-between chamfer-sm corner-crosshairs relative overflow-hidden group hover:border-[#2b3a54] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span className="font-heading font-extrabold uppercase tracking-wider text-[11px] text-zinc-300">
            HAZARDS IN PERIMETER
          </span>
          <AlertCircle className={`w-3.5 h-3.5 ${activeHazards > 0 ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`} />
        </div>
        <div className="my-1.5 flex items-baseline gap-1">
          <span className={`text-3xl font-mono font-black tracking-tight ${activeHazards > 0 ? 'text-red-400' : 'text-white'}`}>
            {activeHazards.toString().padStart(2, '0')}
          </span>
          <span className="text-xs font-mono text-zinc-400 font-bold">TARGETS</span>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between pt-1 border-t border-[#161f2e]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-ping"></span>
            <span className="text-zinc-300 font-semibold">RADAR+THERMAL</span>
          </span>
          <span className="text-zinc-400">0-30m</span>
        </div>
      </div>

      {/* 3. Vehicle Speed */}
      <div className="tech-panel p-2.5 flex flex-col justify-between chamfer-sm corner-crosshairs relative overflow-hidden group hover:border-[#2b3a54] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span className="font-heading font-extrabold uppercase tracking-wider text-[11px] text-zinc-300">
            HEMM GROUND SPEED
          </span>
          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-1">
          <span className="text-3xl font-mono font-black tracking-tight text-white">{speed.toFixed(0)}</span>
          <span className="text-xs font-mono text-zinc-400 font-bold">KM/H</span>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between pt-1 border-t border-[#161f2e]">
          <span className="text-amber-400 font-bold">REC: ≤{environment?.recommendedSpeedKmh ?? 10} KM/H</span>
          <span className="text-zinc-400">BENCH #4</span>
        </div>
      </div>

      {/* 4. Nearest Hazard */}
      <div className="tech-panel p-2.5 flex flex-col justify-between chamfer-sm corner-crosshairs relative overflow-hidden group hover:border-[#2b3a54] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span className="font-heading font-extrabold uppercase tracking-wider text-[11px] text-zinc-300">
            CLOSEST PROXIMITY
          </span>
          <Navigation className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-1">
          <span
            className={`text-3xl font-mono font-black tracking-tight ${
              nearestHazard !== null && nearestHazard !== undefined && nearestHazard <= 5
                ? 'text-red-400 animate-pulse'
                : nearestHazard !== null && nearestHazard !== undefined && nearestHazard <= 15
                ? 'text-amber-400'
                : 'text-white'
            }`}
          >
            {nearestHazard !== null && nearestHazard !== undefined ? nearestHazard.toFixed(1) : '--'}
          </span>
          <span className="text-xs font-mono text-zinc-400 font-bold">m</span>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono pt-1 border-t border-[#161f2e] truncate">
          {nearestHazard !== null && nearestHazard !== undefined && nearestHazard <= 5
            ? '🚨 CRITICAL (0-5m)'
            : nearestHazard !== null && nearestHazard !== undefined && nearestHazard <= 15
            ? '⚠️ DANGER (5-15m)'
            : 'PERIMETER MONITORED'}
        </div>
      </div>

      {/* 5. Max Thermal Temperature */}
      <div className="tech-panel p-2.5 flex flex-col justify-between chamfer-sm corner-crosshairs relative overflow-hidden group hover:border-[#2b3a54] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span className="font-heading font-extrabold uppercase tracking-wider text-[11px] text-zinc-300">
            LWIR MAX TEMP
          </span>
          <Flame className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-1">
          <span className="text-3xl font-mono font-black tracking-tight text-purple-300">{maxTemp.toFixed(1)}</span>
          <span className="text-xs font-mono text-purple-400/80 font-bold">°C</span>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between pt-1 border-t border-[#161f2e]">
          <span className="text-zinc-300">640×480 LWIR</span>
          <span className="text-purple-400 font-bold">HOTSPOT</span>
        </div>
      </div>

      {/* 6. System Confidence */}
      <div className="tech-panel p-2.5 flex flex-col justify-between chamfer-sm corner-crosshairs relative overflow-hidden group hover:border-[#2b3a54] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span className="font-heading font-extrabold uppercase tracking-wider text-[11px] text-zinc-300">
            FUSION CONFIDENCE
          </span>
          <Target className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-1">
          <span className="text-3xl font-mono font-black tracking-tight text-emerald-400">{confidence.toFixed(1)}</span>
          <span className="text-xs font-mono text-emerald-500/80 font-bold">%</span>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between pt-1 border-t border-[#161f2e]">
          <span className="text-emerald-400 font-semibold">KALMAN SYNC</span>
          <span className="text-zinc-400 font-mono">28MS</span>
        </div>
      </div>
    </div>
  );
};
