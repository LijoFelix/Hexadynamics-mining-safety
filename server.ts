/**
 * Full-Stack Express & WebSocket Server
 * Hexadynamics - Real-Time Smart Mining Safety & Hazard Detection System
 */

import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

import { db } from './server/db';
import { simulator } from './server/simulator';
import { calculateEstimatedHazardPosition } from './server/geo';
import { evaluateHazardRisk } from './server/risk';
import { Hazard, WSMessage } from './src/types';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws/live' });

  // Store active WebSocket clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);

    // Immediately send full system state sync
    const initialSync: WSMessage = {
      type: 'full_sync',
      payload: {
        vehicle: db.getVehicle('DUMPER-07')!,
        hazards: db.getHazards(),
        alerts: db.getAlerts(),
        sensors: db.getSensors(),
        environment: db.getEnvironment(),
        stats: db.getStats(),
        config: db.getConfig(),
      },
    };

    ws.send(JSON.stringify(initialSync));

    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  // Broadcast helper
  function broadcast(message: WSMessage) {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  // Periodic simulation loop tick (every 1000ms)
  setInterval(() => {
    simulator.tick();

    const vehicle = db.getVehicle('DUMPER-07');
    if (vehicle) {
      broadcast({ type: 'vehicle_location_updated', payload: vehicle });
    }

    const hazards = db.getHazards();
    for (const h of hazards) {
      broadcast({ type: 'hazard_updated', payload: h });
    }

    broadcast({ type: 'environment_updated', payload: db.getEnvironment() });
    broadcast({ type: 'stats_updated', payload: db.getStats() });
  }, 1000);

  // ===================== REST API ENDPOINTS =====================

  // Health
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'OPERATIONAL',
      service: 'Hexadynamics Mining Safety API',
      version: '1.0.0-PROTOTYPE',
      region: 'Bailadila Open-Cast Iron Ore Mine',
      mode: db.getConfig().mode,
      simulatorRunning: simulator.getIsRunning(),
      activeScenario: simulator.getScenario(),
      connectedWsClients: clients.size,
      timestamp: new Date().toISOString(),
    });
  });

  // Vehicles
  app.get('/api/vehicles', (_req: Request, res: Response) => {
    res.json(db.getVehicles());
  });

  app.get('/api/vehicles/:id', (req: Request, res: Response) => {
    const v = db.getVehicle(req.params.id);
    if (!v) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(v);
  });

  app.get('/api/vehicles/:id/location', (req: Request, res: Response) => {
    const v = db.getVehicle(req.params.id);
    if (!v) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({
      id: v.id,
      latitude: v.latitude,
      longitude: v.longitude,
      speedKmh: v.speedKmh,
      headingDeg: v.headingDeg,
      pitchDeg: v.pitchDeg,
      rollDeg: v.rollDeg,
      status: v.status,
      timestamp: v.lastUpdated,
    });
  });

  app.post('/api/vehicles/:id/location', (req: Request, res: Response) => {
    const { latitude, longitude, speedKmh, headingDeg, pitchDeg, rollDeg, status } = req.body;
    
    // Security & Range Validation
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }
    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    const v = db.getVehicle(req.params.id);
    if (!v) return res.status(404).json({ error: 'Vehicle not found' });

    if (latitude !== undefined) v.latitude = Number(latitude);
    if (longitude !== undefined) v.longitude = Number(longitude);
    if (speedKmh !== undefined) v.speedKmh = Math.max(0, Number(speedKmh));
    if (headingDeg !== undefined) v.headingDeg = (Number(headingDeg) + 360) % 360;
    if (pitchDeg !== undefined) v.pitchDeg = Number(pitchDeg);
    if (rollDeg !== undefined) v.rollDeg = Number(rollDeg);
    if (status !== undefined) v.status = status;
    v.lastUpdated = new Date().toISOString();

    db.updateVehicle(v);
    broadcast({ type: 'vehicle_location_updated', payload: v });
    res.json(v);
  });

  // Detections & Raw Sensors ingestion
  app.get('/api/detections', (_req: Request, res: Response) => {
    res.json(db.getHazards());
  });

  app.post('/api/detections', (req: Request, res: Response) => {
    const {
      type,
      confidence,
      temperatureC,
      distanceM,
      relativeBearingDeg = 0,
      pixelX = 320,
      pixelY = 240,
      bbox = [0.4, 0.4, 0.2, 0.2],
    } = req.body;

    if (!type || distanceM === undefined) {
      return res.status(400).json({ error: 'Missing required detection fields: type, distanceM' });
    }

    const vehicle = db.getVehicle('DUMPER-07')!;
    const env = db.getEnvironment();
    const config = db.getConfig();

    const geo = calculateEstimatedHazardPosition(
      vehicle.latitude,
      vehicle.longitude,
      vehicle.headingDeg,
      relativeBearingDeg,
      distanceM
    );

    const risk = evaluateHazardRisk(
      distanceM,
      type,
      relativeBearingDeg,
      vehicle.speedKmh,
      env.visibilityMeters,
      temperatureC || 30,
      config.dangerZones
    );

    const hazardId = `HZ-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newHazard: Hazard = {
      id: hazardId,
      type,
      confidence: confidence || 0.95,
      temperatureC: temperatureC || 36.5,
      distanceM: Number(distanceM),
      bearingDeg: Number(relativeBearingDeg),
      pixelX,
      pixelY,
      bbox,
      latitude: geo.latitude,
      longitude: geo.longitude,
      riskLevel: risk.riskLevel,
      dangerZone: risk.dangerZone,
      timeToCollisionSec: risk.timeToCollisionSec,
      timestamp: now,
      source: 'HARDWARE / INGESTION_API',
      isEstimatedPosition: true,
      status: 'ACTIVE',
      firstDetected: now,
      lastDetected: now,
      recommendedAction: risk.recommendedAction,
      trackingCount: 1,
    };

    db.setHazard(newHazard);
    broadcast({ type: 'hazard_created', payload: newHazard });

    if (risk.isImmediateAlert) {
      const alert = {
        id: `ALT-${Date.now()}`,
        severity: risk.riskLevel === 'CRITICAL' ? 'CRITICAL' as const : 'HIGH' as const,
        title: `Ingested Hazard: ${type}`,
        message: `${type} detected at ${distanceM}m — Action: ${risk.recommendedAction}`,
        distanceM,
        timestamp: now,
        acknowledged: false,
        dismissed: false,
        hazardId: newHazard.id,
        vehicleId: vehicle.id,
        actionRequired: risk.recommendedAction,
      };
      db.addAlert(alert);
      broadcast({ type: 'alert_created', payload: alert });
    }

    res.status(201).json(newHazard);
  });

  // Hazards
  app.get('/api/hazards', (_req: Request, res: Response) => {
    res.json(db.getHazards());
  });

  app.get('/api/hazards/:id', (req: Request, res: Response) => {
    const h = db.getHazard(req.params.id);
    if (!h) return res.status(404).json({ error: 'Hazard not found' });
    res.json(h);
  });

  app.post('/api/hazards', (req: Request, res: Response) => {
    const hazardData = req.body;
    db.setHazard(hazardData);
    broadcast({ type: 'hazard_created', payload: hazardData });
    res.status(201).json(hazardData);
  });

  // Alerts
  app.get('/api/alerts', (_req: Request, res: Response) => {
    res.json(db.getAlerts());
  });

  app.post('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
    const a = db.acknowledgeAlert(req.params.id);
    if (!a) return res.status(404).json({ error: 'Alert not found' });
    res.json(a);
  });

  app.post('/api/alerts/:id/dismiss', (req: Request, res: Response) => {
    const a = db.dismissAlert(req.params.id);
    if (!a) return res.status(404).json({ error: 'Alert not found' });
    res.json(a);
  });

  // Sensors & Diagnostics
  app.get('/api/sensors', (_req: Request, res: Response) => {
    res.json(db.getSensors());
  });

  app.post('/api/sensors/:id/toggle', (req: Request, res: Response) => {
    const s = db.toggleSensorStatus(req.params.id);
    if (!s) return res.status(404).json({ error: 'Sensor not found' });
    broadcast({ type: 'sensor_status_changed', payload: db.getSensors() });
    res.json(s);
  });

  // Environment
  app.get('/api/environment', (_req: Request, res: Response) => {
    res.json(db.getEnvironment());
  });

  app.post('/api/environment', (req: Request, res: Response) => {
    const updated = db.updateEnvironment(req.body);
    broadcast({ type: 'environment_updated', payload: updated });
    res.json(updated);
  });

  // Statistics & Analytics
  app.get('/api/statistics', (_req: Request, res: Response) => {
    res.json(db.getStats());
  });

  app.get('/api/analytics', (_req: Request, res: Response) => {
    res.json(db.getAnalytics());
  });

  // Config & Simulation Control
  app.get('/api/config', (_req: Request, res: Response) => {
    res.json(db.getConfig());
  });

  app.post('/api/config', (req: Request, res: Response) => {
    const updated = db.updateConfig(req.body);
    res.json(updated);
  });

  app.post('/api/simulation/scenario', (req: Request, res: Response) => {
    const { scenario } = req.body;
    if (!scenario) return res.status(400).json({ error: 'Missing scenario name' });
    simulator.setScenario(scenario);
    res.json({ success: true, scenario, state: 'ACTIVE' });
  });

  app.post('/api/simulation/toggle', (req: Request, res: Response) => {
    const nextState = !simulator.getIsRunning();
    simulator.setRunning(nextState);
    res.json({ running: nextState });
  });

  app.post('/api/simulation/reset', (_req: Request, res: Response) => {
    simulator.reset();
    res.json({ success: true, message: 'Simulation reset to baseline' });
  });

  // ===================== VITE MIDDLEWARE =====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[HEXADYNAMICS] Mining Safety Control Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
