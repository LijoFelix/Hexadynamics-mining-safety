import React from 'react';
import { AlertTriangle, Flame, Navigation, Crosshair, ArrowUpRight, Shield } from 'lucide-react';
import { Hazard } from '../../types';

interface ActiveHazardsListProps {
  hazards: Hazard[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string) => void;
  onCenterMap: (lat: number, lon: number) => void;
  className?: string;
}

export const ActiveHazardsList: React.FC<ActiveHazardsListProps> = ({
  hazards,
  selectedHazardId,
  onSelectHazard,
  onCenterMap,
  className = '',
}) => {
  const getRiskBadge = (risk: Hazard['riskLevel']) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/60 animate-pulse font-black';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/60 font-bold';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/60 font-bold';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 font-bold';
    }
  };

  const getTypeIcon = (type: Hazard['type']) => {
    switch (type) {
      case 'PERSON':
        return '🚶';
      case 'DUMPER':
        return '🚛';
      case 'EXCAVATOR':
        return '🏗';
      case 'OBSTACLE':
        return '🪨';
      case 'THERMAL_HOTSPOT':
        return '🔥';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={`tech-panel chamfer-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#0b0f17] border-b border-[#1c2638] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-amber-500/20 border border-amber-500/40 chamfer-sm text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
            PERIMETER HAZARDS DETECTED
          </span>
        </div>
        <span className="px-2 py-0.5 chamfer-sm text-[10px] font-mono font-bold bg-[#080b10] text-amber-400 border border-[#1c2638]">
          {hazards.length} TARGETS
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#161f2e] max-h-[360px]">
        {hazards.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs font-mono">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
            No active hazards in vehicle danger perimeter. Path is clear.
          </div>
        ) : (
          hazards.map((h) => {
            const isSelected = selectedHazardId === h.id;
            return (
              <div
                key={h.id}
                onClick={() => onSelectHazard(h.id)}
                className={`p-2.5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#181206] border-l-4 border-amber-500'
                    : 'bg-[#080b10] hover:bg-[#0f1522]'
                }`}
              >
                {/* Left: Icon & Object Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 chamfer-sm bg-[#05070a] border border-[#1c2638] flex items-center justify-center text-sm shadow-inner shrink-0">
                    {getTypeIcon(h.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-zinc-100 truncate font-heading tracking-wide">
                        {h.type}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        [{h.id}]
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2">
                      <span className="text-purple-300 flex items-center gap-0.5 font-bold">
                        <Flame className="w-3 h-3 text-purple-400" />
                        {h.temperatureC.toFixed(1)}°C
                      </span>
                      <span>•</span>
                      <span>CONF: {(h.confidence * 100).toFixed(0)}%</span>
                      {h.timeToCollisionSec !== null && (
                        <>
                          <span>•</span>
                          <span className={h.timeToCollisionSec < 3 ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                            TTC: {h.timeToCollisionSec.toFixed(1)}s
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Distance & Risk Badge */}
                <div className="flex items-center gap-2.5 shrink-0 text-right">
                  <div>
                    <div className="text-sm font-black font-mono text-white">
                      {h.distanceM.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">m</span>
                    </div>
                    <div className="text-[9px] text-zinc-400 font-mono font-bold">
                      {h.bearingDeg > 0 ? `+${h.bearingDeg}°` : `${h.bearingDeg}°`} BRG
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 chamfer-sm border font-mono uppercase ${getRiskBadge(
                        h.riskLevel
                      )}`}
                    >
                      {h.riskLevel}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCenterMap(h.latitude, h.longitude);
                      }}
                      title="Track on Tactical GIS Map"
                      className="text-zinc-400 hover:text-amber-400 p-1 chamfer-sm hover:bg-[#162032]"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Notice */}
      <div className="p-2 bg-[#080b10] border-t border-[#1c2638] text-[9px] text-zinc-400 font-mono flex items-center justify-between">
        <span>SAFETY RADIUS: 0-15m DANGER</span>
        <span className="text-amber-400 font-bold">SENSOR FUSION: ACTIVE</span>
      </div>
    </div>
  );
};
