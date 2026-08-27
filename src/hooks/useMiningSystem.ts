/**
 * Mining System React Hook & State Manager
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { soundManager } from '../services/audio';
import {
  Vehicle,
  Hazard,
  Alert,
  SensorStatus,
  EnvironmentState,
  DashboardStats,
  SystemConfig,
  WSMessage,
} from '../types';

export function useMiningSystem() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sensors, setSensors] = useState<SensorStatus[]>([]);
  const [environment, setEnvironment] = useState<EnvironmentState | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('live');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [mapCenterTarget, setMapCenterTarget] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);
  const [activeScenario, setActiveScenario] = useState<string>('SIH_PRESENTATION_DEMO');
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);

  const prevCriticalAlertCountRef = useRef<number>(0);

  // Initialize and listen to WebSocket
  useEffect(() => {
    const unsubConn = api.onConnectionChange(setIsConnected);

    const unsubMsg = api.onMessage((msg: WSMessage) => {
      switch (msg.type) {
        case 'full_sync':
          setVehicle(msg.payload.vehicle);
          setHazards(msg.payload.hazards);
          setAlerts(msg.payload.alerts);
          setSensors(msg.payload.sensors);
          setEnvironment(msg.payload.environment);
          setStats(msg.payload.stats);
          setConfig(msg.payload.config);
          setActiveScenario(msg.payload.config.simulationScenario);
          break;

        case 'vehicle_location_updated':
          setVehicle(msg.payload);
          break;

        case 'hazard_created':
        case 'hazard_updated':
          setHazards((prev) => {
            const index = prev.findIndex((h) => h.id === msg.payload.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = msg.payload;
              return updated;
            }
            return [...prev, msg.payload];
          });
          break;

        case 'alert_created':
          setAlerts((prev) => [msg.payload, ...prev.filter((a) => a.id !== msg.payload.id)]);
          soundManager.notifyAlertStatusChange(msg.payload.id, msg.payload.severity);
          break;

        case 'sensor_status_changed':
          setSensors(msg.payload);
          break;

        case 'environment_updated':
          setEnvironment(msg.payload);
          break;

        case 'stats_updated':
          setStats(msg.payload);
          break;
      }
    });

    // Fallback initial REST load
    const loadInitial = async () => {
      try {
        const [v, h, a, s, e, st, c] = await Promise.all([
          api.getVehicles(),
          api.getHazards(),
          api.getAlerts(),
          api.getSensors(),
          api.getEnvironment(),
          api.getStats(),
          api.getConfig(),
        ]);
        if (v.length > 0) setVehicle(v[0]);
        setHazards(h);
        setAlerts(a);
        setSensors(s);
        setEnvironment(e);
        setStats(st);
        setConfig(c);
        setActiveScenario(c.simulationScenario);
      } catch {
        // server might still be connecting
      }
    };
    loadInitial();

    return () => {
      unsubConn();
      unsubMsg();
    };
  }, []);

  // Centralized Hazard Evaluation & Audio Safety Scheduler (Single prioritized alarm)
  useEffect(() => {
    soundManager.evaluateAndSyncHazards(hazards);
  }, [hazards, isAudioMuted]);

  const toggleMute = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      soundManager.setMuted(next);
      return next;
    });
  }, []);

  const acknowledgeAlert = useCallback(async (id: string) => {
    try {
      const targetAlert = alerts.find((a) => a.id === id);
      if (targetAlert && targetAlert.hazardId) {
        soundManager.acknowledgeHazard(targetAlert.hazardId);
      }
      await api.acknowledgeAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
      );
    } catch {
      // error
    }
  }, [alerts]);

  const dismissAlert = useCallback(async (id: string) => {
    try {
      await api.dismissAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // error
    }
  }, []);

  const toggleSensor = useCallback(async (sensorId: string) => {
    try {
      const updated = await api.toggleSensor(sensorId);
      setSensors((prev) => prev.map((s) => (s.id === sensorId ? updated : s)));
    } catch {
      // error
    }
  }, []);

  const selectScenario = useCallback(async (scenarioName: string) => {
    try {
      setActiveScenario(scenarioName);
      await api.triggerScenario(scenarioName);
    } catch {
      // error
    }
  }, []);

  const toggleSimulation = useCallback(async () => {
    try {
      const res = await api.toggleSimulation();
      setIsSimRunning(res.running);
    } catch {
      // error
    }
  }, []);

  const resetSimulation = useCallback(async () => {
    try {
      await api.resetSimulation();
      const h = await api.getHazards();
      setHazards(h);
    } catch {
      // error
    }
  }, []);

  const centerOnMap = useCallback((lat: number, lon: number, zoom: number = 19) => {
    setMapCenterTarget({ lat, lon, zoom });
  }, []);

  const selectedHazard = hazards.find((h) => h.id === selectedHazardId) || null;

  return {
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
  };
}
