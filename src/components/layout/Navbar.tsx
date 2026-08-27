import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Radio,
  MapPin,
  Flame,
  AlertTriangle,
  Bell,
  Truck,
  BarChart3,
  Cpu,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Vehicle } from '../../types';
import { AudioControlPanel } from '../alerts/AudioControlPanel';

interface NavbarProps {
  vehicle: Vehicle | null;
  isConnected: boolean;
  isSimRunning: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAudioMuted: boolean;
  toggleMute: () => void;
  toggleSimulation: () => void;
  resetSimulation: () => void;
  activeScenario: string;
  selectScenario: (scenario: string) => void;
  criticalAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  vehicle,
  isConnected,
  isSimRunning,
  activeTab,
  setActiveTab,
  isAudioMuted,
  toggleMute,
  toggleSimulation,
  resetSimulation,
  activeScenario,
  selectScenario,
  criticalAlertCount,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'live', label: 'LIVE HUD', icon: Activity, tag: '01' },
    { id: 'map', label: 'MINING MAP', icon: MapPin, tag: '02' },
    { id: 'thermal', label: 'THERMAL LWIR', icon: Flame, tag: '03' },
    { id: 'hazards', label: 'HAZARD REGISTRY', icon: AlertTriangle, tag: '04' },
    { id: 'alerts', label: 'SAFETY ALERTS', icon: Bell, tag: '05', badge: criticalAlertCount },
    { id: 'vehicles', label: 'HEMM FLEET', icon: Truck, tag: '06' },
    { id: 'analytics', label: 'KPI ANALYTICS', icon: BarChart3, tag: '07' },
    { id: 'sensors', label: 'HAL & SENSORS', icon: Cpu, tag: '08' },
  ];

  return (
    <header className="bg-[#0b0f17] border-b border-[#1c2638] sticky top-0 z-50 shadow-md">
      {/* Top Banner Row */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#161f2e]">
        {/* Brand & Team Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#161f2e] border-2 border-amber-500/70 chamfer-sm flex items-center justify-center text-amber-400 font-extrabold shadow-inner relative group">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black tracking-tight text-lg text-white uppercase flex items-center gap-1.5">
                HEXA<span className="text-amber-400 font-light">DYNAMICS</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-[#121824] text-amber-400/90 font-mono font-bold border border-amber-500/30 chamfer-sm">
                SIH26007
              </span>
            </div>
            <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
              <span>FOG &amp; LOW-VISIBILITY SAFETY SYSTEM</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400/80">BAILADILA IRON PIT</span>
            </div>
          </div>
        </div>

        {/* Center Live / Simulation Indicator & Vehicle Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Pill */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#080b10] border border-[#202a3c] text-xs font-mono chamfer-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-bold tracking-wide">
              {isSimRunning ? 'TELEMETRY LIVE' : 'SIMULATION PAUSED'}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400 text-[11px]">BENCH #04</span>
          </div>

          {/* Vehicle Info */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#080b10] border border-[#202a3c] text-xs font-mono text-zinc-300 chamfer-sm">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">HEMM:</span>
            <strong className="text-zinc-100 font-bold">{vehicle?.id || 'DUMPER-07'}</strong>
            <span className="text-zinc-700">•</span>
            <span className="text-emerald-400 text-[11px] font-bold">ONLINE</span>
          </div>

          {/* Quick Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-[#080b10] px-2.5 py-1 border border-[#202a3c] text-xs chamfer-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">SCENARIO:</span>
            <select
              value={activeScenario}
              onChange={(e) => selectScenario(e.target.value)}
              aria-label="Simulation Scenario"
              className="bg-transparent text-xs text-amber-300 font-mono font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="SIH_PRESENTATION_DEMO" className="bg-[#0e131d] text-zinc-100">
                [DEMO] Person In Fog (11.8m → 3.7m)
              </option>
              <option value="HAUL_ROAD_DUMPER" className="bg-[#0e131d] text-zinc-100">
                [HEMM] Heavy Dumper Blind-Spot
              </option>
              <option value="BENCH_PIT_OBSTACLE" className="bg-[#0e131d] text-zinc-100">
                [GEO] Bench Pit Boulder Obstacle
              </option>
              <option value="THERMAL_HOTSPOT" className="bg-[#0e131d] text-zinc-100">
                [TEMP] Engine Thermal Spike (92°C)
              </option>
              <option value="CONTINUOUS_RANDOM" className="bg-[#0e131d] text-zinc-100">
                [AUTONOMOUS] Autonomous Patrol Loop
              </option>
            </select>
          </div>
        </div>

        {/* Right Controls: Sim Play/Pause, Mute, Status, Clock */}
        <div className="flex items-center gap-2">
          {/* Sim Play/Pause & Reset */}
          <button
            onClick={toggleSimulation}
            title={isSimRunning ? 'Pause Telemetry Simulation' : 'Resume Telemetry Simulation'}
            className={`px-2.5 py-1.5 border chamfer-sm transition-all flex items-center gap-1.5 text-xs font-mono font-bold ${
              isSimRunning
                ? 'bg-[#121926] border-[#25334a] text-emerald-400 hover:bg-[#182234]'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
            }`}
          >
            {isSimRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={resetSimulation}
            title="Reset Scenario Baseline"
            className="p-1.5 border bg-[#121926] border-[#25334a] text-zinc-300 hover:text-white hover:bg-[#1c2638] chamfer-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Audio Engine Control Strip */}
          <AudioControlPanel compact={true} />

          {/* Connection Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#080b10] border border-[#202a3c] text-xs font-mono chamfer-sm">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`} />
            <span className={`font-bold ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              {isConnected ? 'CAN 2.0B' : 'LINK LOST'}
            </span>
          </div>

          {/* Time Display */}
          <div className="px-2.5 py-1 bg-[#080b10] border border-[#202a3c] text-xs font-mono text-zinc-200 font-extrabold tracking-wider chamfer-sm">
            {timeStr || '00:00:00'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Strip */}
      <div className="px-4 flex items-center gap-1.5 overflow-x-auto py-1.5 bg-[#080b10] border-t border-[#121824] scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-heading font-extrabold tracking-wider uppercase transition-all whitespace-nowrap chamfer-sm relative ${
                isActive
                  ? 'bg-[#162032] text-amber-300 border border-amber-500/50 shadow-inner'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#101622] border border-transparent'
              }`}
            >
              <span className="text-[9px] font-mono text-zinc-500">{item.tag}</span>
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-red-600 text-white animate-pulse chamfer-sm">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
