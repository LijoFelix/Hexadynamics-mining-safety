import React, { useState } from 'react';
import { Alert, AlertSeverity } from '../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertOctagon,
  AlertTriangle,
  Flame,
  Info,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { AudioControlPanel } from '../components/alerts/AudioControlPanel';

interface AlertsViewProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onSelectHazard?: (hazardId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onAcknowledge,
  onDismiss,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'UNACK') return !a.acknowledged;
    return a.severity === severityFilter;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/60 animate-pulse font-black';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/60 font-bold';
      case 'WARNING':
        return 'bg-yellow-500/20 text-amber-300 border-amber-500/60 font-bold';
      case 'THERMAL':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/60 font-bold';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/60 font-bold';
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* 1. Official Audible Alert Sound Controller Panel */}
      <AudioControlPanel />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 tech-panel p-1.5 chamfer-sm text-xs font-mono overflow-x-auto">
        {['ALL', 'UNACK', 'CRITICAL', 'HIGH', 'WARNING', 'THERMAL', 'INFO'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSeverityFilter(tab)}
            className={`px-3 py-1 chamfer-sm uppercase font-bold text-[10px] transition-colors ${
              severityFilter === tab
                ? 'bg-amber-500 text-black font-black'
                : 'text-zinc-400 hover:text-zinc-200 bg-[#080b10] border border-[#1c2638]'
            }`}
          >
            {tab === 'UNACK' ? 'UNACKNOWLEDGED' : tab}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="tech-panel chamfer-sm p-12 text-center text-zinc-500 font-mono text-xs">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-emerald-500/50" />
            No active safety alerts recorded matching the selected filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 chamfer-sm border transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'bg-[#1e0709] border-red-600/90 shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                  : alert.severity === 'HIGH'
                  ? 'bg-[#1a0e05] border-orange-600/70'
                  : alert.severity === 'THERMAL'
                  ? 'bg-[#14061a] border-purple-600/70'
                  : 'tech-panel'
              } ${alert.acknowledged ? 'opacity-65' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-white font-heading">{alert.title}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 chamfer-sm border uppercase ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      UNIT: <strong className="text-white">{alert.vehicleId}</strong>
                    </span>
                    {alert.distanceM !== undefined && (
                      <span className="text-xs text-amber-300 font-mono font-bold">
                        DISTANCE: <strong>{alert.distanceM.toFixed(1)}m</strong>
                      </span>
                    )}
                    {alert.severity === 'CRITICAL' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-red-900/60 text-red-200 border border-red-500/50 chamfer-sm flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-red-400" />
                        FM PULSING AUDIO TRIGGERED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 mt-1 font-medium leading-relaxed font-body">
                    {alert.message}
                  </p>

                  {alert.actionRequired && (
                    <div className="mt-2 text-xs font-mono bg-[#05070a] px-3 py-1 chamfer-sm border border-amber-500/40 text-amber-300 font-bold">
                      OPERATOR DIRECTIVE: <strong>{alert.actionRequired}</strong>
                    </div>
                  )}
                </div>

                <div className="text-right text-xs font-mono text-zinc-400 shrink-0 font-bold">
                  <div>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                  <div className="text-[10px] text-zinc-500">{new Date(alert.timestamp).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-3 pt-2 border-t border-[#1c2638] flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-zinc-500">ID: {alert.id}</span>

                <div className="flex items-center gap-2">
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3.5 py-1 chamfer-sm font-black font-mono bg-amber-500 hover:bg-amber-400 text-black transition-colors flex items-center gap-1.5 shadow uppercase tracking-wider text-[10px]"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>ACKNOWLEDGE</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-mono">
                      <CheckCheck className="w-3.5 h-3.5" /> ACKNOWLEDGED
                    </span>
                  )}

                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="p-1.5 chamfer-sm text-zinc-500 hover:text-red-400 hover:bg-[#121926] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
