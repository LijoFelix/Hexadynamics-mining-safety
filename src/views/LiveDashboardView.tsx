import React from 'react';
import { MiningMap } from '../components/map/MiningMap';
import { ThermalCameraFeed } from '../components/thermal/ThermalCameraFeed';
import { ActiveHazardsList } from '../components/hazards/ActiveHazardsList';
import { FogMonitor } from '../components/environment/FogMonitor';
import { SensorHealthGrid } from '../components/sensors/SensorHealthGrid';
import { AlertsPanel } from '../components/alerts/AlertsPanel';
import { AudioControlPanel } from '../components/alerts/AudioControlPanel';
import { Vehicle, Hazard, SensorStatus, EnvironmentState, Alert } from '../types';

interface LiveDashboardViewProps {
  vehicle: Vehicle | null;
  hazards: Hazard[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string) => void;
  targetCenter: { lat: number; lon: number; zoom?: number } | null;
  onCenterMap: (lat: number, lon: number) => void;
  sensors: SensorStatus[];
  onToggleSensor: (id: string) => void;
  environment: EnvironmentState | null;
  alerts: Alert[];
  onAcknowledgeAlert: (id: string) => void;
  onDismissAlert: (id: string) => void;
}

export const LiveDashboardView: React.FC<LiveDashboardViewProps> = ({
  vehicle,
  hazards,
  selectedHazardId,
  onSelectHazard,
  targetCenter,
  onCenterMap,
  sensors,
  onToggleSensor,
  environment,
  alerts,
  onAcknowledgeAlert,
  onDismissAlert,
}) => {
  return (
    <div className="p-3 space-y-3">
      {/* Top Grid: Main Interactive Map (Left) + System Status & Sensors (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left 8 Cols: Large Interactive Leaflet Mining Map */}
        <div className="lg:col-span-8 flex flex-col">
          <MiningMap
            vehicle={vehicle}
            hazards={hazards}
            selectedHazardId={selectedHazardId}
            onSelectHazard={onSelectHazard}
            targetCenter={targetCenter}
            className="h-[460px] lg:h-[500px]"
          />
        </div>

        {/* Right 4 Cols: Environmental Fog Monitor & Sensor Health & Audio Alert Engine */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <AudioControlPanel />
          <FogMonitor environment={environment} className="flex-1" />
          <SensorHealthGrid sensors={sensors} onToggleSensor={onToggleSensor} className="flex-1" />
        </div>
      </div>

      {/* Bottom Grid: Real-Time Thermal Feed (Left) + Active Hazards (Center) + Live Alert Feed (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* 4 Cols: Thermal Camera Canvas */}
        <div className="lg:col-span-4 flex flex-col">
          <ThermalCameraFeed
            hazards={hazards}
            selectedHazardId={selectedHazardId}
            onSelectHazard={onSelectHazard}
            className="h-[340px]"
          />
        </div>

        {/* 4 Cols: Active Hazards in Danger Perimeter */}
        <div className="lg:col-span-4 flex flex-col">
          <ActiveHazardsList
            hazards={hazards}
            selectedHazardId={selectedHazardId}
            onSelectHazard={onSelectHazard}
            onCenterMap={onCenterMap}
            className="h-[340px]"
          />
        </div>

        {/* 4 Cols: Safety Alerts Feed */}
        <div className="lg:col-span-4 md:col-span-2 flex flex-col">
          <AlertsPanel
            alerts={alerts}
            onAcknowledge={onAcknowledgeAlert}
            onDismiss={onDismissAlert}
            onSelectHazard={onSelectHazard}
            className="h-[340px]"
          />
        </div>
      </div>
    </div>
  );
};
