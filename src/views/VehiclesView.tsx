import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { api } from '../services/api';
import { Truck, Navigation, Gauge, User, Fuel, Thermometer, MapPin, Crosshair, Sparkles } from 'lucide-react';

interface VehiclesViewProps {
  currentVehicle: Vehicle | null;
  onCenterMap: (lat: number, lon: number) => void;
  onNavigateToMap: () => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  currentVehicle,
  onCenterMap,
  onNavigateToMap,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const v = await api.getVehicles();
        setVehicles(v);
      } catch {
        // error
      }
    };
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'MOVING':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 font-bold';
      case 'LOADING':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/60 font-bold';
      case 'ALERT':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/60 font-black animate-pulse';
      case 'IDLE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/60 font-bold';
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/60 font-bold';
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between tech-panel p-3.5 chamfer-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 chamfer-sm bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white font-heading">
              HEAVY EARTH MOVING MACHINERY (HEMM) FLEET ROSTER
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Bailadila Iron Ore Sector • Automated Collision Avoidance &amp; Telemetry Mesh
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-zinc-300">
          <span className="font-bold">CONNECTED FLEET:</span> <strong className="text-amber-400 bg-[#080b10] px-2 py-0.5 border border-[#1c2638] chamfer-sm">[{vehicles.length} UNITS]</strong>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {vehicles.map((v) => {
          const isCurrent = currentVehicle?.id === v.id;
          return (
            <div
              key={v.id}
              className={`p-3.5 chamfer-sm border transition-all flex flex-col justify-between space-y-3 ${
                isCurrent
                  ? 'bg-[#0e1420] border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'tech-panel hover:border-[#2a3a54]'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base font-heading text-white">{v.id}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-black font-mono px-1.5 py-0.2 chamfer-sm bg-amber-500 text-black uppercase">
                        ACTIVE HUD
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono font-medium">{v.name} [{v.type}]</div>
                </div>

                <span
                  className={`text-[9px] font-mono px-2 py-0.5 chamfer-sm border uppercase ${getStatusColor(
                    v.status
                  )}`}
                >
                  {v.status}
                </span>
              </div>

              {/* Specs & Driver */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#05070a] p-2 chamfer-sm border border-[#161f2e]">
                  <div className="text-[9px] text-zinc-500 flex items-center gap-1 uppercase font-bold">
                    <User className="w-3 h-3 text-sky-400" />
                    OPERATOR
                  </div>
                  <div className="font-bold text-zinc-100 truncate mt-0.5">{v.driverName}</div>
                </div>

                <div className="bg-[#05070a] p-2 chamfer-sm border border-[#161f2e]">
                  <div className="text-[9px] text-zinc-500 flex items-center gap-1 uppercase font-bold">
                    <Gauge className="w-3 h-3 text-emerald-400" />
                    SPEED / HEADING
                  </div>
                  <div className="font-bold text-zinc-100 mt-0.5">
                    {v.speedKmh.toFixed(0)} km/h • {v.headingDeg}°
                  </div>
                </div>

                <div className="bg-[#05070a] p-2 chamfer-sm border border-[#161f2e]">
                  <div className="text-[9px] text-zinc-500 flex items-center gap-1 uppercase font-bold">
                    <Fuel className="w-3 h-3 text-amber-400" />
                    FUEL / POWER
                  </div>
                  <div className="font-bold text-zinc-100 mt-0.5">{v.fuelPercent ?? v.batteryPercent}%</div>
                </div>

                <div className="bg-[#05070a] p-2 chamfer-sm border border-[#161f2e]">
                  <div className="text-[9px] text-zinc-500 flex items-center gap-1 uppercase font-bold">
                    <Thermometer className="w-3 h-3 text-purple-400" />
                    ENGINE TEMP
                  </div>
                  <div className="font-bold text-zinc-100 mt-0.5">{v.engineTempC ?? 84.5}°C</div>
                </div>
              </div>

              {/* Payload Progress Bar */}
              <div className="bg-[#05070a] p-2 chamfer-sm border border-[#161f2e] space-y-1 text-xs font-mono">
                <div className="flex justify-between text-[10px] text-zinc-400 font-bold uppercase">
                  <span>IRON ORE PAYLOAD:</span>
                  <span className="text-amber-400">
                    {v.payloadTons} / {v.maxPayloadTons} TONS
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#0b0f17] chamfer-sm overflow-hidden border border-[#1c2638]">
                  <div
                    className="h-full bg-amber-500 chamfer-sm transition-all"
                    style={{ width: `${Math.min(100, (v.payloadTons / v.maxPayloadTons) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-[#1c2638] flex items-center justify-between text-xs font-mono">
                <span className="text-[9px] text-zinc-500 font-bold">
                  GPS: {v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}
                </span>

                <button
                  onClick={() => {
                    onCenterMap(v.latitude, v.longitude);
                    onNavigateToMap();
                  }}
                  className="px-3 py-1 chamfer-sm bg-[#121926] hover:bg-amber-500 hover:text-black border border-[#243147] text-zinc-200 transition-colors flex items-center gap-1 font-bold text-[10px]"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>TRACK ON MAP</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
