import React, { useState } from 'react';
import { ThermalCameraFeed } from '../components/thermal/ThermalCameraFeed';
import { Hazard } from '../types';
import { Flame, Sliders, ShieldAlert, Cpu, Eye, Info, Crosshair } from 'lucide-react';

interface ThermalMonitorViewProps {
  hazards: Hazard[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string) => void;
  onCenterMap: (lat: number, lon: number) => void;
}

export const ThermalMonitorView: React.FC<ThermalMonitorViewProps> = ({
  hazards,
  selectedHazardId,
  onSelectHazard,
  onCenterMap,
}) => {
  const [emissivity, setEmissivity] = useState<number>(0.95);
  const [gainMode, setGainMode] = useState<'HIGH' | 'LOW' | 'AUTO'>('AUTO');
  const [noiseReduction, setNoiseReduction] = useState<boolean>(true);

  return (
    <div className="p-3 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between tech-panel px-4 py-2.5 chamfer-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 chamfer-sm bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white font-heading">
              LWIR LONG-WAVE THERMAL SENSING SUITE
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Uncooled Microbolometer (8–14 µm) • NETD &lt; 40 mK • Heavy Fog &amp; Iron Ore Dust Penetration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 chamfer-sm bg-[#121926] border border-[#243147] text-purple-300 font-bold">
            OPTICS: 50.0° HFOV GERMANIUM LENS
          </span>
        </div>
      </div>

      {/* Main Grid: Large Thermal Feed (Left 8 cols) + Controls & Telemetry (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 flex flex-col">
          <ThermalCameraFeed
            hazards={hazards}
            selectedHazardId={selectedHazardId}
            onSelectHazard={onSelectHazard}
            className="h-[520px]"
          />
        </div>

        {/* Right Settings & Telemetry */}
        <div className="lg:col-span-4 space-y-3">
          {/* Thermal Sensor Calibration Controls */}
          <div className="tech-panel chamfer-sm p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-white uppercase font-heading border-b border-[#1c2638] pb-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              THERMAL CORE CALIBRATION (RADIOMETRIC)
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span className="font-bold text-[10px] uppercase">Surface Emissivity (ε):</span>
                  <span className="text-purple-300 font-bold">{emissivity.toFixed(2)} (Iron Ore Pit)</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="1.00"
                  step="0.01"
                  value={emissivity}
                  onChange={(e) => setEmissivity(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-[#080b10]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-zinc-400 text-[10px] font-bold uppercase">AGC GAIN MODE:</span>
                <div className="flex gap-1">
                  {(['AUTO', 'HIGH', 'LOW'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setGainMode(mode)}
                      className={`px-2 py-0.5 chamfer-sm text-[10px] font-bold font-mono uppercase ${
                        gainMode === mode
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-[#080b10] border border-[#1c2638] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-zinc-400 text-[10px] font-bold uppercase">FOG DE-NOISING FILTER:</span>
                <button
                  onClick={() => setNoiseReduction(!noiseReduction)}
                  className={`px-2.5 py-1 chamfer-sm text-[10px] font-bold font-mono ${
                    noiseReduction
                      ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                      : 'bg-[#080b10] border border-[#1c2638] text-zinc-500'
                  }`}
                >
                  {noiseReduction ? 'FILTER ACTIVE' : 'BYPASSED'}
                </button>
              </div>
            </div>
          </div>

          {/* Thermal Target Signatures List */}
          <div className="tech-panel chamfer-sm p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-white uppercase font-heading border-b border-[#1c2638] pb-2">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                DETECTED THERMAL SIGNATURES
              </span>
              <span className="text-amber-400 font-mono font-bold text-[10px] bg-[#080b10] px-2 py-0.5 border border-[#1c2638] chamfer-sm">
                {hazards.length} TARGETS
              </span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {hazards.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onSelectHazard(h.id)}
                  className="p-2 chamfer-sm bg-[#080b10] border border-[#161f2e] hover:border-purple-500/50 cursor-pointer flex items-center justify-between text-xs font-mono transition-colors"
                >
                  <div>
                    <div className="font-bold text-zinc-100 font-heading">{h.type}</div>
                    <div className="text-[9px] text-zinc-400">
                      PIXEL: ({h.pixelX}, {h.pixelY}) | {h.distanceM.toFixed(1)}m
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-purple-300 block text-sm">{h.temperatureC.toFixed(1)}°C</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCenterMap(h.latitude, h.longitude);
                      }}
                      className="text-[9px] text-amber-400 hover:underline font-bold"
                    >
                      [ TRACK ]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
