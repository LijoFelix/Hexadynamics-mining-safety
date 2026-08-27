import React from 'react';
import { useMiningSystem } from './hooks/useMiningSystem';
import { Navbar } from './components/layout/Navbar';
import { MetricStrip } from './components/layout/MetricStrip';
import { CollisionBanner } from './components/layout/CollisionBanner';
import { HazardDetailModal } from './components/hazards/HazardDetailModal';
import { CriticalAlertOverlay } from './components/hazards/CriticalAlertOverlay';

// Views
import { LiveDashboardView } from './views/LiveDashboardView';
import { FullMapView } from './views/FullMapView';
import { ThermalMonitorView } from './views/ThermalMonitorView';
import { HazardsView } from './views/HazardsView';
import { AlertsView } from './views/AlertsView';
import { VehiclesView } from './views/VehiclesView';
import { AnalyticsView } from './views/AnalyticsView';
import { SensorsHardwareView } from './views/SensorsHardwareView';

export function App() {
  const {
    isConnected,
    vehicle,
    hazards,
    alerts,
    sensors,
    environment,
    stats,
    config,
    activeTab,
    setActiveTab,
    selectedHazardId,
    setSelectedHazardId,
    selectedHazard,
    isAudioMuted,
    toggleMute,
    acknowledgeAlert,
    dismissAlert,
    toggleSensor,
    activeScenario,
    selectScenario,
    isSimRunning,
    toggleSimulation,
    resetSimulation,
    mapCenterTarget,
    centerOnMap,
  } = useMiningSystem();

  const criticalAlertCount = alerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length;

  const [acknowledgedCriticalHazards, setAcknowledgedCriticalHazards] = React.useState<Set<string>>(new Set());

  // Find active critical hazard requiring emergency operator intervention
  const activeCriticalHazard = hazards.find(
    (h) =>
      (h.riskLevel === 'CRITICAL' || h.dangerZone === 'CRITICAL' || h.distanceM <= 5.0) &&
      h.status === 'ACTIVE' &&
      !acknowledgedCriticalHazards.has(h.id)
  ) || null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950 font-sans">
      {/* 1. Industrial Command Navbar */}
      <Navbar
        vehicle={vehicle}
        isConnected={isConnected}
        isSimRunning={isSimRunning}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAudioMuted={isAudioMuted}
        toggleMute={toggleMute}
        toggleSimulation={toggleSimulation}
        resetSimulation={resetSimulation}
        activeScenario={activeScenario}
        selectScenario={selectScenario}
        criticalAlertCount={criticalAlertCount}
      />

      {/* 2. Top Metric Strip */}
      <MetricStrip stats={stats} environment={environment} />

      {/* 3. Collision Warning Alert Banner (Visible when imminent hazard detected) */}
      <CollisionBanner
        hazards={hazards}
        onSelectHazard={(id) => setSelectedHazardId(id)}
        onCenterMap={(lat, lon) => {
          centerOnMap(lat, lon);
          if (activeTab !== 'live' && activeTab !== 'map') {
            setActiveTab('live');
          }
        }}
      />

      {/* 4. Main Body Views */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto">
        {activeTab === 'live' && (
          <LiveDashboardView
            vehicle={vehicle}
            hazards={hazards}
            selectedHazardId={selectedHazardId}
            onSelectHazard={(id) => setSelectedHazardId(id)}
            targetCenter={mapCenterTarget}
            onCenterMap={(lat, lon) => centerOnMap(lat, lon)}
            sensors={sensors}
            onToggleSensor={toggleSensor}
            environment={environment}
            alerts={alerts}
            onAcknowledgeAlert={acknowledgeAlert}
            onDismissAlert={dismissAlert}
          />
        )}

        {activeTab === 'map' && (
          <FullMapView
            vehicle={vehicle}
            hazards={hazards}
            selectedHazardId={selectedHazardId}
            onSelectHazard={(id) => setSelectedHazardId(id)}
            targetCenter={mapCenterTarget}
            onCenterMap={(lat, lon) => centerOnMap(lat, lon)}
          />
        )}

        {activeTab === 'thermal' && (
          <ThermalMonitorView
            hazards={hazards}
            selectedHazardId={selectedHazardId}
            onSelectHazard={(id) => setSelectedHazardId(id)}
            onCenterMap={(lat, lon) => {
              centerOnMap(lat, lon);
              setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'hazards' && (
          <HazardsView
            hazards={hazards}
            selectedHazardId={selectedHazardId}
            onSelectHazard={(id) => setSelectedHazardId(id)}
            onCenterMap={(lat, lon) => {
              centerOnMap(lat, lon);
              setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
            onDismiss={dismissAlert}
            onSelectHazard={(hazardId) => {
              setSelectedHazardId(hazardId);
              setActiveTab('hazards');
            }}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehiclesView
            currentVehicle={vehicle}
            onCenterMap={(lat, lon) => centerOnMap(lat, lon)}
            onNavigateToMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'sensors' && (
          <SensorsHardwareView
            sensors={sensors}
            onToggleSensor={toggleSensor}
            config={config}
          />
        )}
      </main>

      {/* 5. Detailed Hazard Modal */}
      {selectedHazard && (
        <HazardDetailModal
          hazard={selectedHazard}
          onClose={() => setSelectedHazardId(null)}
          onCenterMap={(lat, lon) => {
            centerOnMap(lat, lon);
            if (activeTab !== 'live' && activeTab !== 'map') {
              setActiveTab('live');
            }
          }}
        />
      )}

      {/* 5b. High-Priority Critical Hazard Interlock Overlay */}
      {activeCriticalHazard && (
        <CriticalAlertOverlay
          hazard={activeCriticalHazard}
          onAcknowledge={(hazardId) => {
            setAcknowledgedCriticalHazards((prev) => new Set(prev).add(hazardId));
            const relatedAlert = alerts.find((a) => a.hazardId === hazardId);
            if (relatedAlert) {
              acknowledgeAlert(relatedAlert.id);
            }
          }}
          onInspect={(hazardId) => {
            setSelectedHazardId(hazardId);
            if (activeTab !== 'live' && activeTab !== 'map') {
              setActiveTab('live');
            }
          }}
        />
      )}

      {/* 6. Footer with Statutory Disclaimer & Team Meta */}
      <footer className="bg-[#05070a] border-t border-[#1c2638] px-4 py-2.5 text-xs font-mono text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-black text-amber-400 font-heading tracking-wider">HEXADYNAMICS</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-300 font-mono text-[11px] font-bold">SIH Batch 2028 | Problem ID: SIH26007</span>
          <span className="hidden md:inline text-zinc-600">•</span>
          <span className="hidden md:inline text-zinc-400 text-[11px]">Bailadila Iron Ore Mines (Extreme Fog &amp; Low-Visibility Safe Haulage)</span>
        </div>

        <div className="text-[10px] text-zinc-500 font-mono">
          PROTOTYPE DECISION SUPPORT SYSTEM • ACTIVE SENSOR ESTIMATES &amp; HAZARD TELEMETRY
        </div>
      </footer>
    </div>
  );
}

export default App;
