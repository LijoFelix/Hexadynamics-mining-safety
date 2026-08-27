import React from 'react';
import { Cpu, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { SensorStatus } from '../../types';

interface SensorHealthGridProps {
  sensors: SensorStatus[];
  onToggleSensor: (sensorId: string) => void;
  className?: string;
}

export const SensorHealthGrid: React.FC<SensorHealthGridProps> = ({
  sensors,
  onToggleSensor,
  className = '',
}) => {
  const getStatusBadge = (status: SensorStatus['status']) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono text-[9px] chamfer-sm bg-emerald-950/60 border border-emerald-700/60 px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 inline-block animate-pulse"></span>
            ONLINE
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-[9px] chamfer-sm bg-amber-950/60 border border-amber-700/60 px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 bg-amber-400 inline-block"></span>
            DEGRADED
          </span>
        );
      case 'DISCONNECTED':
      case 'ERROR':
        return (
          <span className="flex items-center gap-1.5 text-red-400 font-bold font-mono text-[9px] chamfer-sm bg-red-950/60 border border-red-700/60 px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 bg-red-400 inline-block"></span>
            DISCONNECTED
          </span>
        );
    }
  };

  return (
    <div className={`tech-panel chamfer-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#0b0f17] border-b border-[#1c2638] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-500/20 border border-emerald-500/40 chamfer-sm text-emerald-400">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
            SENSOR ARRAY TELEMETRY &amp; HAL
          </span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono font-bold bg-[#080b10] px-2 py-0.5 border border-[#1c2638] chamfer-sm">
          {sensors.filter((s) => s.status === 'ONLINE').length} / {sensors.length} ACTIVE
        </span>
      </div>

      {/* Sensor List */}
      <div className="p-2 space-y-1.5 overflow-y-auto flex-1 max-h-[320px]">
        {sensors.map((sensor) => {
          const isOnline = sensor.status === 'ONLINE';
          return (
            <div
              key={sensor.id}
              className={`px-2.5 py-1.5 chamfer-sm border transition-colors flex items-center justify-between gap-2 ${
                isOnline
                  ? 'bg-[#080b10] border-[#161f2e] hover:border-[#243147]'
                  : 'bg-[#18080a] border-red-800/60'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-zinc-100 truncate">
                    {sensor.category}
                  </span>
                  <span className="text-[10px] text-zinc-400 truncate hidden sm:inline font-mono">
                    [{sensor.name}]
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono truncate">
                  LAT: {sensor.latencyMs}ms | {sensor.sampleRateHz}Hz | {sensor.details}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(sensor.status)}
                <button
                  onClick={() => onToggleSensor(sensor.id)}
                  title={isOnline ? 'Simulate Disconnect' : 'Reconnect Sensor'}
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 chamfer-sm border transition-colors ${
                    isOnline
                      ? 'bg-[#121926] border-[#243147] text-zinc-400 hover:text-red-400 hover:border-red-600'
                      : 'bg-emerald-950 border-emerald-600 text-emerald-300 hover:bg-emerald-900'
                  }`}
                >
                  {isOnline ? 'CUT' : 'RESTORE'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Notice */}
      <div className="px-3 py-1 bg-[#080b10] border-t border-[#1c2638] text-[9px] text-zinc-400 font-mono flex items-center justify-between">
        <span>Hardware Abstraction Layer (HAL)</span>
        <span className="text-emerald-400 font-bold">CAN 2.0B / RTSP / NMEA-0183</span>
      </div>
    </div>
  );
};
