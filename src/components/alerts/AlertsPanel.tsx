import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, AlertOctagon, AlertTriangle, Info, Flame, Crosshair, Volume2 } from 'lucide-react';
import { Alert, AlertSeverity } from '../../types';
import { soundManager } from '../../services/audio';

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onSelectHazard?: (hazardId: string) => void;
  className?: string;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAcknowledge,
  onDismiss,
  onSelectHazard,
  className = '',
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNACKNOWLEDGED') return !a.acknowledged;
    return a.severity === filter;
  });

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'THERMAL':
        return <Flame className="w-4 h-4 text-purple-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

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
    <div className={`tech-panel chamfer-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#0b0f17] border-b border-[#1c2638] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-amber-500/20 border border-amber-500/40 chamfer-sm text-amber-400">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
            SAFETY ALERT LOG &amp; DIRECTIVES
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 chamfer-sm bg-[#080b10] border border-[#1c2638] text-amber-300 font-bold">
            {alerts.filter((a) => !a.acknowledged).length} PENDING
          </span>
        </div>

        {/* Severity Filter Tabs & Quick Test Alarm */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono">
          <button
            onClick={() => soundManager.testAlarm()}
            title="Play provided alert sound: universfield-digital-alarm-clock-151920.mp3.mpeg"
            className="px-2 py-0.5 chamfer-sm bg-red-950/70 hover:bg-red-900 border border-red-600/70 text-red-300 font-bold flex items-center gap-1 transition-colors"
          >
            <Volume2 className="w-2.5 h-2.5 text-red-400 animate-pulse" />
            <span>TEST ALARM</span>
          </button>

          {['ALL', 'UNACKNOWLEDGED', 'CRITICAL', 'HIGH', 'WARNING'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 chamfer-sm transition-colors uppercase font-bold ${
                filter === f
                  ? 'bg-amber-500 text-black font-black'
                  : 'text-zinc-400 hover:text-zinc-200 bg-[#080b10] border border-[#1c2638]'
              }`}
            >
              {f === 'UNACKNOWLEDGED' ? 'UNACK' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="p-2 space-y-2 overflow-y-auto flex-1 max-h-[380px]">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs font-mono">
            No safety alarms matching filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-2.5 chamfer-sm border transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'bg-[#1e0709] border-red-600/80 shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                  : alert.severity === 'HIGH'
                  ? 'bg-[#1a0e05] border-orange-600/70'
                  : alert.severity === 'THERMAL'
                  ? 'bg-[#14061a] border-purple-600/70'
                  : 'bg-[#080b10] border-[#161f2e]'
              } ${alert.acknowledged ? 'opacity-65' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="p-1 chamfer-sm bg-[#05070a] border border-[#1c2638] shrink-0 mt-0.5">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-black text-xs text-white uppercase tracking-wide">
                        {alert.title}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 chamfer-sm border uppercase ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      {alert.distanceM !== undefined && (
                        <span className="text-[10px] text-amber-300 font-mono font-bold">
                          [{alert.distanceM.toFixed(1)}m]
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-300 font-medium mt-0.5 leading-snug">
                      {alert.message}
                    </div>
                    {alert.actionRequired && (
                      <div className="text-[10px] text-amber-300 font-mono mt-1 font-bold bg-[#05070a]/80 p-1 chamfer-sm border border-amber-500/30">
                        DIRECTIVE: {alert.actionRequired}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 font-mono shrink-0 text-right font-bold">
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-2 pt-1.5 border-t border-[#1c2638] flex items-center justify-between text-xs font-mono">
                <div className="text-[9px] text-zinc-500 font-bold">
                  UNIT: {alert.vehicleId}
                </div>

                <div className="flex items-center gap-1.5">
                  {alert.hazardId && onSelectHazard && (
                    <button
                      onClick={() => onSelectHazard(alert.hazardId!)}
                      className="px-2 py-0.5 chamfer-sm text-[9px] font-mono font-bold bg-[#121926] hover:bg-[#1a2538] text-zinc-200 border border-[#243147] transition-colors flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3 text-amber-400" />
                      LOCATE
                    </button>
                  )}

                  {!alert.acknowledged ? (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-2.5 py-0.5 chamfer-sm text-[9px] font-black font-mono bg-amber-500 hover:bg-amber-400 text-black transition-colors flex items-center gap-1 shadow-sm uppercase tracking-wider"
                    >
                      <CheckCheck className="w-3 h-3" />
                      ACKNOWLEDGE
                    </button>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">✓ ACKNOWLEDGED</span>
                  )}

                  <button
                    onClick={() => onDismiss(alert.id)}
                    title="Dismiss Alert"
                    className="p-1 chamfer-sm text-zinc-500 hover:text-red-400 hover:bg-[#121926] transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
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
