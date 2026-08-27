import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnalyticsData } from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, ShieldCheck, Zap, Activity, Award, TrendingUp, AlertTriangle } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.getAnalytics();
        setData(res);
      } catch {
        // error
      }
    };
    fetchAnalytics();
  }, []);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#a855f7', '#3b82f6'];

  const fallbackHourly = [
    { hour: '00:00', detections: 4, alerts: 1, visibilityAvg: 4.2 },
    { hour: '02:00', detections: 6, alerts: 2, visibilityAvg: 3.1 },
    { hour: '04:00', detections: 9, alerts: 4, visibilityAvg: 2.8 },
    { hour: '06:00', detections: 14, alerts: 7, visibilityAvg: 3.4 },
    { hour: '08:00', detections: 18, alerts: 5, visibilityAvg: 6.8 },
    { hour: '10:00', detections: 12, alerts: 3, visibilityAvg: 8.5 },
    { hour: '12:00', detections: 8, alerts: 1, visibilityAvg: 11.2 },
    { hour: '14:00', detections: 11, alerts: 2, visibilityAvg: 9.4 },
    { hour: '16:00', detections: 15, alerts: 6, visibilityAvg: 5.2 },
    { hour: '18:00', detections: 22, alerts: 9, visibilityAvg: 3.6 },
    { hour: '20:00', detections: 17, alerts: 5, visibilityAvg: 3.9 },
    { hour: '22:00', detections: 10, alerts: 3, visibilityAvg: 4.0 },
  ];

  const fallbackBreakdown = [
    { name: 'Person / Worker', value: 34, color: '#ef4444' },
    { name: 'Heavy Dumper', value: 48, color: '#f97316' },
    { name: 'Loading Shovel', value: 22, color: '#eab308' },
    { name: 'Fallen Boulder', value: 16, color: '#a855f7' },
    { name: 'Thermal Hotspot', value: 12, color: '#3b82f6' },
  ];

  const hourlyData = data?.hourlyDetections?.length ? data.hourlyDetections : fallbackHourly;
  const breakdownData = data?.hazardTypeBreakdown?.length ? data.hazardTypeBreakdown : fallbackBreakdown;

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between tech-panel p-3.5 chamfer-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 chamfer-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white font-heading">
              MINE SAFETY AUDIT &amp; INCIDENT PREVENTIVE TELEMETRY
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Bailadila Iron Ore Sector • 24-Hour Continuous Hazard Avoidance Audit
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 chamfer-sm bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold">
          0 CRITICAL COLLISIONS IN 24H
        </span>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="tech-panel p-3 chamfer-sm font-mono">
          <div className="text-[9px] text-zinc-400 uppercase font-bold flex items-center justify-between">
            <span>COLLISION INCIDENTS</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-heading">0</div>
          <div className="text-[9px] text-zinc-500 mt-0.5">100% Proactive Collision Avoidance</div>
        </div>

        <div className="tech-panel p-3 chamfer-sm font-mono">
          <div className="text-[9px] text-zinc-400 uppercase font-bold flex items-center justify-between">
            <span>DETECTION PRECISION</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-heading">94.8%</div>
          <div className="text-[9px] text-zinc-500 mt-0.5">In 3-5m Extreme Low Visibility Fog</div>
        </div>

        <div className="tech-panel p-3 chamfer-sm font-mono">
          <div className="text-[9px] text-zinc-400 uppercase font-bold flex items-center justify-between">
            <span>EDGE AI FUSION LATENCY</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 mt-1 font-heading">28 ms</div>
          <div className="text-[9px] text-zinc-500 mt-0.5">Thermal + Radar Sensor Fusion Loop</div>
        </div>

        <div className="tech-panel p-3 chamfer-sm font-mono">
          <div className="text-[9px] text-zinc-400 uppercase font-bold flex items-center justify-between">
            <span>NEAR-MISS ESCALATIONS</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 mt-1 font-heading">18</div>
          <div className="text-[9px] text-zinc-500 mt-0.5">Promptly Acknowledged by Operators</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Chart 1: Hourly Detections & Safety Alerts */}
        <div className="lg:col-span-8 tech-panel p-3.5 chamfer-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-[#1c2638] pb-2">
            <span className="text-xs font-black uppercase font-heading text-white">
              HOURLY HAZARD DETECTIONS &amp; SAFETY ALARMS
            </span>
            <span className="text-[9px] font-mono text-amber-300 font-bold bg-[#080b10] px-2 py-0.5 border border-[#1c2638] chamfer-sm">
              PEAK FOG DENSITY AT DAWN &amp; DUSK
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#475569" fontSize={10} fontFamily="JetBrains Mono, monospace" />
                <YAxis stroke="#475569" fontSize={10} fontFamily="JetBrains Mono, monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080b10',
                    borderColor: '#243147',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#e2e8f0',
                  }}
                />
                <Area type="monotone" dataKey="detections" name="Hazards Detected" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorDetections)" />
                <Area type="monotone" dataKey="alerts" name="Safety Alerts" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAlerts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hazard Classification Breakdown Pie Chart */}
        <div className="lg:col-span-4 tech-panel p-3.5 chamfer-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 border-b border-[#1c2638] pb-2">
            <span className="text-xs font-black uppercase font-heading text-white">
              HAZARD CLASS DISTRIBUTION
            </span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080b10',
                    borderColor: '#243147',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#e2e8f0',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-zinc-300 pt-2 border-t border-[#1c2638]">
            {breakdownData.map((b, i) => (
              <div key={b.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 chamfer-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="truncate font-bold">{b.name} ({b.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
