import React, { useState } from 'react';
import { Hazard, ObjectType, RiskLevel } from '../types';
import { AlertTriangle, Flame, Plus, Search, Filter, Crosshair, MapPin, Sparkles, Navigation2 } from 'lucide-react';
import { api } from '../services/api';

interface HazardsViewProps {
  hazards: Hazard[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string) => void;
  onCenterMap: (lat: number, lon: number) => void;
}

export const HazardsView: React.FC<HazardsViewProps> = ({
  hazards,
  selectedHazardId,
  onSelectHazard,
  onCenterMap,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [showInjectModal, setShowInjectModal] = useState<boolean>(false);

  // Injection state
  const [injectType, setInjectType] = useState<ObjectType>('PERSON');
  const [injectDist, setInjectDist] = useState<number>(6.5);
  const [injectTemp, setInjectTemp] = useState<number>(37.2);
  const [injectBearing, setInjectBearing] = useState<number>(0);
  const [injectConfidence, setInjectConfidence] = useState<number>(0.92);

  const filteredHazards = hazards.filter((h) => {
    const matchesSearch =
      h.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.dangerZone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || h.type === typeFilter;
    const matchesRisk = riskFilter === 'ALL' || h.riskLevel === riskFilter;
    return matchesSearch && matchesType && matchesRisk;
  });

  const handleInjectDetection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.postDetection({
        type: injectType,
        distanceM: injectDist,
        temperatureC: injectTemp,
        confidence: injectConfidence,
        relativeBearingDeg: injectBearing,
        pixelX: 320 + Math.sin((injectBearing * Math.PI) / 180) * 180,
        pixelY: 240,
      });
      setShowInjectModal(false);
    } catch {
      // error
    }
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/60 animate-pulse font-black';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/60 font-bold';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold';
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 tech-panel p-3.5 chamfer-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 chamfer-sm bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white font-heading">
              ACTIVE HAZARD REGISTRY &amp; TARGET TRACKING
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Fused Multi-Sensor Perimeter Detections • Bailadila Mining Grid
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInjectModal(true)}
          className="px-3.5 py-1.5 chamfer-sm text-xs font-black font-mono bg-amber-500 hover:bg-amber-400 text-black transition-colors flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>INJECT SENSOR DETECTION</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 tech-panel p-2.5 chamfer-sm">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3" />
          <input
            type="text"
            placeholder="Search hazard ID or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#05070a] border border-[#1c2638] chamfer-sm pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-400 font-bold uppercase text-[10px]">TYPE:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by hazard type"
            className="w-full bg-[#05070a] border border-[#1c2638] chamfer-sm px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-bold"
          >
            <option value="ALL">ALL TYPES</option>
            <option value="PERSON">PERSON</option>
            <option value="DUMPER">DUMPER</option>
            <option value="EXCAVATOR">EXCAVATOR</option>
            <option value="OBSTACLE">OBSTACLE</option>
            <option value="THERMAL_HOTSPOT">THERMAL_HOTSPOT</option>
          </select>
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-400 font-bold uppercase text-[10px]">RISK:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            aria-label="Filter by risk severity level"
            className="w-full bg-[#05070a] border border-[#1c2638] chamfer-sm px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-bold"
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL (0-5m)</option>
            <option value="HIGH">HIGH (5-15m)</option>
            <option value="MEDIUM">MEDIUM (15-30m)</option>
            <option value="LOW">LOW (&gt;30m)</option>
          </select>
        </div>
      </div>

      {/* Hazards Table */}
      <div className="tech-panel chamfer-sm overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b0f17] text-zinc-400 border-b border-[#1c2638] uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">HAZARD ID</th>
                <th className="p-3">OBJECT TYPE</th>
                <th className="p-3">DISTANCE</th>
                <th className="p-3">RISK LEVEL</th>
                <th className="p-3">THERMAL TEMP</th>
                <th className="p-3">BEARING / TTC</th>
                <th className="p-3">ESTIMATED COORDINATES</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161f2e]">
              {filteredHazards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    No hazards matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredHazards.map((hazard) => (
                  <tr
                    key={hazard.id}
                    onClick={() => onSelectHazard(hazard.id)}
                    className="hover:bg-[#121926]/80 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-bold text-amber-300 font-mono">{hazard.id}</td>
                    <td className="p-3">
                      <span className="font-heading font-black text-white">{hazard.type}</span>
                    </td>
                    <td className="p-3 font-bold text-white font-mono">
                      {hazard.distanceM.toFixed(1)} <span className="text-zinc-500 font-normal">m</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 chamfer-sm border text-[9px] uppercase ${getRiskBadge(
                          hazard.riskLevel
                        )}`}
                      >
                        {hazard.riskLevel}
                      </span>
                    </td>
                    <td className="p-3 text-purple-300 font-bold">
                      {hazard.temperatureC.toFixed(1)}°C
                    </td>
                    <td className="p-3 text-zinc-300">
                      {hazard.bearingDeg > 0 ? `+${hazard.bearingDeg}` : hazard.bearingDeg}° |{' '}
                      {hazard.timeToCollisionSec !== null ? `${hazard.timeToCollisionSec.toFixed(1)}s` : '--'}
                    </td>
                    <td className="p-3 text-zinc-400 text-[11px]">
                      {hazard.latitude.toFixed(6)}, {hazard.longitude.toFixed(6)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCenterMap(hazard.latitude, hazard.longitude);
                        }}
                        className="px-2.5 py-1 chamfer-sm bg-[#121926] hover:bg-amber-500 hover:text-black border border-[#243147] text-zinc-200 transition-colors inline-flex items-center gap-1 font-bold text-[10px]"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                        <span>MAP</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Detection Injection Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="tech-panel chamfer-md w-full max-w-md p-4 space-y-4 shadow-2xl border border-[#1c2638]">
            <div className="flex items-center justify-between border-b border-[#1c2638] pb-2">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase font-heading">
                <Sparkles className="w-4 h-4" />
                INJECT CUSTOM SENSOR DETECTION
              </div>
              <button
                onClick={() => setShowInjectModal(false)}
                className="text-zinc-400 hover:text-white chamfer-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInjectDetection} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-zinc-400 block mb-1 font-bold text-[10px] uppercase">TARGET OBJECT CLASS:</label>
                <select
                  value={injectType}
                  onChange={(e) => setInjectType(e.target.value as ObjectType)}
                  className="w-full bg-[#05070a] border border-[#1c2638] chamfer-sm p-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="PERSON">PERSON (Worker in Heavy Fog)</option>
                  <option value="DUMPER">DUMPER (Heavy Haul Truck)</option>
                  <option value="EXCAVATOR">EXCAVATOR (Loading Shovel)</option>
                  <option value="OBSTACLE">OBSTACLE (Fallen Pit Boulder)</option>
                  <option value="THERMAL_HOTSPOT">THERMAL_HOTSPOT (Overheated Bearing)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold text-[10px] uppercase">DISTANCE (METERS):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    value={injectDist}
                    onChange={(e) => setInjectDist(parseFloat(e.target.value))}
                    className="w-full bg-[#05070a] border border-[#1c2638] chamfer-sm p-2 text-zinc-100 font-bold"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-bold text-[10px] uppercase">TEMPERATURE (°C):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={injectTemp}
                    onChange={(e) => setInjectTemp(parseFloat(e.target.value))}
                    className="w-full bg-[#05070a] border border-[#1c2638] chamfer-sm p-2 text-zinc-100 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold text-[10px] uppercase">RELATIVE BEARING (°):</label>
                  <input
                    type="number"
                    min="-45"
                    max="45"
                    value={injectBearing}
                    onChange={(e) => setInjectBearing(parseInt(e.target.value))}
                    className="w-full bg-[#05070a] border border-[#1c2638] chamfer-sm p-2 text-zinc-100 font-bold"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-bold text-[10px] uppercase">AI CONFIDENCE (0-1):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="1.0"
                    value={injectConfidence}
                    onChange={(e) => setInjectConfidence(parseFloat(e.target.value))}
                    className="w-full bg-[#05070a] border border-[#1c2638] chamfer-sm p-2 text-zinc-100 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#1c2638]">
                <button
                  type="button"
                  onClick={() => setShowInjectModal(false)}
                  className="px-3.5 py-1.5 chamfer-sm bg-[#121926] text-zinc-300 hover:bg-[#1a2538] border border-[#243147] font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 chamfer-sm font-black font-mono bg-amber-500 hover:bg-amber-400 text-black shadow-sm uppercase tracking-wider"
                >
                  INJECT &amp; BROADCAST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
