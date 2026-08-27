import React, { useState } from 'react';
import { SensorStatus, SystemConfig } from '../types';
import { Cpu, CheckCircle2, AlertTriangle, XCircle, HardDrive, Wifi, Radio, Code2, Play } from 'lucide-react';
import { api } from '../services/api';

interface SensorsHardwareViewProps {
  sensors: SensorStatus[];
  onToggleSensor: (id: string) => void;
  config: SystemConfig | null;
}

export const SensorsHardwareView: React.FC<SensorsHardwareViewProps> = ({
  sensors,
  onToggleSensor,
  config,
}) => {
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        sensor_type: 'THERMAL_RADAR_FUSED',
        detections: [
          {
            class: 'PERSON',
            distance_m: 4.8,
            temperature_c: 37.6,
            relative_bearing_deg: 8.5,
            confidence: 0.96,
          },
        ],
      },
      null,
      2
    )
  );

  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSendTestPayload = async () => {
    try {
      const parsed = JSON.parse(testPayload);
      if (parsed.detections && parsed.detections.length > 0) {
        const d = parsed.detections[0];
        const res = await api.postDetection({
          type: d.class,
          distanceM: d.distance_m,
          temperatureC: d.temperature_c,
          confidence: d.confidence,
          relativeBearingDeg: d.relative_bearing_deg,
        });
        setTestResult(`Success: Detection registered as Hazard #${res.id}`);
      }
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between tech-panel p-3.5 chamfer-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 chamfer-sm bg-sky-500/20 text-sky-400 border border-sky-500/40">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white font-heading">
              HARDWARE ABSTRACTION LAYER (HAL) &amp; SENSOR MATRIX
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Industrial Bus Architecture • Ready for Physical Sensor Rig Integration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 chamfer-sm bg-[#080b10] border border-[#1c2638] text-zinc-300 font-bold text-[10px]">
            BUS PROTOCOL: CAN 2.0B / RTSP / NMEA
          </span>
        </div>
      </div>

      {/* Sensor Subsystems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sensors.map((sensor) => {
          const isOnline = sensor.status === 'ONLINE';
          return (
            <div
              key={sensor.id}
              className={`p-3.5 chamfer-sm border flex flex-col justify-between space-y-3 transition-colors ${
                isOnline ? 'tech-panel' : 'bg-[#1e0709] border-red-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm font-heading text-white uppercase">
                    {sensor.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-black px-2 py-0.5 chamfer-sm border uppercase ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                        : 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                    }`}
                  >
                    {sensor.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-1 font-medium">{sensor.details}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#05070a] p-2.5 chamfer-sm border border-[#161f2e]">
                <div>
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">Sample Rate</span>
                  <span className="font-bold text-zinc-100">{sensor.sampleRateHz} Hz</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">Latency</span>
                  <span className="font-bold text-zinc-100">{sensor.latencyMs} ms</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#1c2638] text-xs font-mono">
                <span className="text-[9px] text-zinc-500 font-bold">ID: {sensor.id}</span>
                <button
                  onClick={() => onToggleSensor(sensor.id)}
                  className={`px-3 py-1 chamfer-sm text-[10px] font-black uppercase transition-colors ${
                    isOnline
                      ? 'bg-[#121926] text-red-400 hover:bg-red-950 border border-red-900/60'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {isOnline ? 'SIMULATE FAULT' : 'RESTORE LINK'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Physical Hardware Mode Direct Injection API Console */}
      <div className="tech-panel p-4 chamfer-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#1c2638] pb-2">
          <div className="flex items-center gap-2 text-xs font-black font-heading text-white uppercase">
            <Code2 className="w-4 h-4 text-amber-400" />
            HARDWARE MODE INGRESS PACKET TESTER (REST API: /api/detections)
          </div>
          <span className="text-[9px] text-zinc-400 font-mono font-bold bg-[#080b10] px-2 py-0.5 border border-[#1c2638] chamfer-sm">
            ACCEPTS JSON PAYLOADS FROM EDGE HW
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-8">
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={8}
              className="w-full bg-[#05070a] border border-[#1c2638] chamfer-sm p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between space-y-2">
            <div className="text-xs text-zinc-400 font-mono bg-[#05070a] p-3 chamfer-sm border border-[#161f2e] leading-relaxed">
              <strong className="text-zinc-200 block mb-1 font-heading">Hardware Interface Notes:</strong>
              When deploying to a physical HEMM test vehicle, this REST &amp; WebSocket API endpoint consumes packets directly from onboard NVIDIA Jetson / Raspberry Pi / CAN-bus bridges.
            </div>

            {testResult && (
              <div className="text-xs font-mono p-2 chamfer-sm bg-[#05070a] border border-amber-500/60 text-amber-300 font-bold">
                {testResult}
              </div>
            )}

            <button
              onClick={handleSendTestPayload}
              className="w-full py-2 chamfer-sm font-black text-xs bg-amber-500 hover:bg-amber-400 text-black shadow transition-colors flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
            >
              <Play className="w-4 h-4" />
              <span>SEND TEST HARDWARE PACKET</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
