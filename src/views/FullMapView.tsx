import React from 'react';
import { MiningMap } from '../components/map/MiningMap';
import { Vehicle, Hazard } from '../types';
import { MapPin, Navigation, Shield, Layers } from 'lucide-react';

interface FullMapViewProps {
  vehicle: Vehicle | null;
  hazards: Hazard[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string) => void;
  targetCenter: { lat: number; lon: number; zoom?: number } | null;
  onCenterMap: (lat: number, lon: number) => void;
}

export const FullMapView: React.FC<FullMapViewProps> = ({
  vehicle,
  hazards,
  selectedHazardId,
  onSelectHazard,
  targetCenter,
  onCenterMap,
}) => {
  return (
    <div className="p-3 space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between tech-panel px-4 py-2 chamfer-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 chamfer-sm bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <MapPin className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white font-heading">
              TACTICAL MINING GIS GEO-SPATIAL MAP
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Bailadila Open-Cast Iron Ore Pit • Haulage Ramps &amp; Danger Buffer Perimeter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-300">
          <span className="hidden sm:inline font-bold">ACTIVE HAZARDS: <strong className="text-amber-400 font-black">[{hazards.length}]</strong></span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span className="font-bold">TARGET UNIT: <strong className="text-white font-black bg-[#080b10] px-2 py-0.5 border border-[#1c2638] chamfer-sm">{vehicle?.id || 'DUMPER-07'}</strong></span>
        </div>
      </div>

      {/* Expanded Map */}
      <MiningMap
        vehicle={vehicle}
        hazards={hazards}
        selectedHazardId={selectedHazardId}
        onSelectHazard={onSelectHazard}
        targetCenter={targetCenter}
        className="h-[calc(100vh-210px)] min-h-[580px]"
      />
    </div>
  );
};
