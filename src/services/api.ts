/**
 * Frontend API & WebSocket Service Layer
 */

import { Vehicle, Hazard, Alert, SensorStatus, EnvironmentState, DashboardStats, SystemConfig, AnalyticsData, WSMessage } from '../types';

export class MiningApiService {
  private ws: WebSocket | null = null;
  private wsListeners: ((msg: WSMessage) => void)[] = [];
  private connectionStatusListeners: ((connected: boolean) => void)[] = [];
  private isConnected: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.connectWebSocket();
  }

  public connectWebSocket() {
    if (typeof window === 'undefined') return;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyConnection(true);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          this.wsListeners.forEach((listener) => listener(data));
        } catch {
          // parse error
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyConnection(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notifyConnection(false);
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, 2500);
  }

  public onMessage(callback: (msg: WSMessage) => void) {
    this.wsListeners.push(callback);
    return () => {
      this.wsListeners = this.wsListeners.filter((l) => l !== callback);
    };
  }

  public onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionStatusListeners.push(callback);
    callback(this.isConnected);
    return () => {
      this.connectionStatusListeners = this.connectionStatusListeners.filter((l) => l !== callback);
    };
  }

  private notifyConnection(status: boolean) {
    this.connectionStatusListeners.forEach((listener) => listener(status));
  }

  // REST API Methods
  public async getHealth() {
    const res = await fetch('/api/health');
    return res.json();
  }

  public async getVehicles(): Promise<Vehicle[]> {
    const res = await fetch('/api/vehicles');
    return res.json();
  }

  public async getVehicle(id: string): Promise<Vehicle> {
    const res = await fetch(`/api/vehicles/${id}`);
    return res.json();
  }

  public async updateVehicleLocation(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const res = await fetch(`/api/vehicles/${id}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  public async getHazards(): Promise<Hazard[]> {
    const res = await fetch('/api/hazards');
    return res.json();
  }

  public async getHazard(id: string): Promise<Hazard> {
    const res = await fetch(`/api/hazards/${id}`);
    return res.json();
  }

  public async postDetection(data: {
    type: string;
    distanceM: number;
    temperatureC?: number;
    confidence?: number;
    relativeBearingDeg?: number;
    pixelX?: number;
    pixelY?: number;
  }): Promise<Hazard> {
    const res = await fetch('/api/detections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  public async getAlerts(): Promise<Alert[]> {
    const res = await fetch('/api/alerts');
    return res.json();
  }

  public async acknowledgeAlert(id: string): Promise<Alert> {
    const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
    return res.json();
  }

  public async dismissAlert(id: string): Promise<Alert> {
    const res = await fetch(`/api/alerts/${id}/dismiss`, { method: 'POST' });
    return res.json();
  }

  public async getSensors(): Promise<SensorStatus[]> {
    const res = await fetch('/api/sensors');
    return res.json();
  }

  public async toggleSensor(id: string): Promise<SensorStatus> {
    const res = await fetch(`/api/sensors/${id}/toggle`, { method: 'POST' });
    return res.json();
  }

  public async getEnvironment(): Promise<EnvironmentState> {
    const res = await fetch('/api/environment');
    return res.json();
  }

  public async updateEnvironment(data: Partial<EnvironmentState>): Promise<EnvironmentState> {
    const res = await fetch('/api/environment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  public async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/statistics');
    return res.json();
  }

  public async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch('/api/analytics');
    return res.json();
  }

  public async getConfig(): Promise<SystemConfig> {
    const res = await fetch('/api/config');
    return res.json();
  }

  public async updateConfig(data: Partial<SystemConfig>): Promise<SystemConfig> {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  public async triggerScenario(scenario: string) {
    const res = await fetch('/api/simulation/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    return res.json();
  }

  public async toggleSimulation() {
    const res = await fetch('/api/simulation/toggle', { method: 'POST' });
    return res.json();
  }

  public async resetSimulation() {
    const res = await fetch('/api/simulation/reset', { method: 'POST' });
    return res.json();
  }
}

export const api = new MiningApiService();
