import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Vehicle, Hazard } from '../../types';
import { Crosshair, Layers, Navigation, Shield, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';

interface MiningMapProps {
  vehicle: Vehicle | null;
  hazards: Hazard[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string) => void;
  targetCenter: { lat: number; lon: number; zoom?: number } | null;
  className?: string;
}

export const MiningMap: React.FC<MiningMapProps> = ({
  vehicle,
  hazards,
  selectedHazardId,
  onSelectHazard,
  targetCenter,
  className = 'h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const hazardMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const hazardLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const zoneCirclesRef = useRef<{ critical?: L.Circle; danger?: L.Circle; warning?: L.Circle }>({});
  
  const [followVehicle, setFollowVehicle] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showLines, setShowLines] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [mapType, setMapType] = useState<'dark' | 'topo' | 'satellite'>('dark');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = vehicle?.latitude ?? 18.67523;
    const initialLon = vehicle?.longitude ?? 81.24512;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark Map Tile Layer (CartoDB Dark Matter / Stadia dark equivalent)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    // Draw Simulated Open Cast Pit Benches & Haul Roads
    const benchPolyline1 = L.polyline(
      [
        [18.6745, 81.2435],
        [18.6755, 81.2440],
        [18.6768, 81.2450],
        [18.6775, 81.2465],
        [18.6770, 81.2478],
      ],
      { color: '#52525b', weight: 3, dashArray: '6, 6' }
    ).addTo(map).bindTooltip('Bench #04 (Level +420m RL)', { permanent: false, className: 'bg-zinc-900 text-zinc-300 text-xs border border-zinc-700' });

    const haulRoadPolyline = L.polyline(
      [
        [18.6740, 81.2430],
        [18.6752, 81.2451],
        [18.6761, 81.2468],
        [18.6774, 81.2459],
        [18.6767, 81.2444],
        [18.6754, 81.2446],
      ],
      { color: '#f59e0b', weight: 4, opacity: 0.5 }
    ).addTo(map).bindTooltip('Main Ore Haulage Ramp', { permanent: false, className: 'bg-zinc-900 text-amber-400 text-xs' });

    // Crusher Hopper Marker
    const crusherIcon = L.divIcon({
      className: 'custom-crusher-icon',
      html: `<div style="background:#dc2626; color:#fff; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px; border:1px solid #fff; white-space:nowrap;">CRUSHER #1</div>`,
    });
    L.marker([18.6778, 81.2472], { icon: crusherIcon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Target Center commands from other UI components
  useEffect(() => {
    if (!mapInstanceRef.current || !targetCenter) return;
    mapInstanceRef.current.flyTo([targetCenter.lat, targetCenter.lon], targetCenter.zoom || 19, {
      duration: 1.0,
    });
  }, [targetCenter]);

  // Update Vehicle Marker & Danger Zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !vehicle) return;

    const vPos: [number, number] = [vehicle.latitude, vehicle.longitude];

    // Follow vehicle if enabled
    if (followVehicle) {
      map.panTo(vPos, { animate: true, duration: 0.5 });
    }

    // Vehicle Icon
    const headingDeg = vehicle.headingDeg || 0;
    const vehicleIconHtml = `
      <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; width:44px; height:44px; border-radius:50%; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.4); transform:scale(${vehicle.status === 'MOVING' ? '1.1' : '1.0'}); transition:transform 0.3s ease;"></div>
        <div style="transform: rotate(${headingDeg}deg); transition: transform 0.3s ease; display:flex; flex-direction:column; align-items:center;">
          <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-bottom:10px solid #f59e0b; margin-bottom:-2px;"></div>
          <div style="width:24px; height:24px; background:#18181b; border:2px solid #f59e0b; border-radius:6px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(245,158,11,0.6);">
            <span style="font-size:12px;">🚜</span>
          </div>
        </div>
        <div style="position:absolute; bottom:-16px; background:#09090b; border:1px solid #f59e0b; color:#fef3c7; font-size:9px; font-weight:800; font-family:monospace; padding:1px 4px; border-radius:3px; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.8);">
          ${vehicle.id} (${vehicle.speedKmh.toFixed(0)} km/h)
        </div>
      </div>
    `;

    const vehicleCustomIcon = L.divIcon({
      className: 'vehicle-marker-container',
      html: vehicleIconHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!vehicleMarkerRef.current) {
      const marker = L.marker(vPos, { icon: vehicleCustomIcon, zIndexOffset: 1000 }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:180px;">
          <div style="font-weight:bold; color:#f59e0b; font-size:13px; margin-bottom:4px;">${vehicle.name}</div>
          <div style="font-size:11px; color:#a1a1aa; line-height:1.4;">
            <div>Driver: <strong>${vehicle.driverName}</strong></div>
            <div>Speed: <strong>${vehicle.speedKmh.toFixed(1)} km/h</strong> | Heading: <strong>${vehicle.headingDeg}°</strong></div>
            <div>Payload: <strong>${vehicle.payloadTons} / ${vehicle.maxPayloadTons} T</strong></div>
            <div>GPS: <strong>${vehicle.latitude.toFixed(6)}, ${vehicle.longitude.toFixed(6)}</strong></div>
          </div>
        </div>
      `);
      vehicleMarkerRef.current = marker;
    } else {
      vehicleMarkerRef.current.setLatLng(vPos);
      vehicleMarkerRef.current.setIcon(vehicleCustomIcon);
    }

    // Danger Zone Circles (5m, 15m, 30m)
    if (showZones) {
      // Critical Zone (5m)
      if (!zoneCirclesRef.current.critical) {
        zoneCirclesRef.current.critical = L.circle(vPos, {
          radius: 5,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(map);
      } else {
        zoneCirclesRef.current.critical.setLatLng(vPos);
      }

      // Danger Zone (15m)
      if (!zoneCirclesRef.current.danger) {
        zoneCirclesRef.current.danger = L.circle(vPos, {
          radius: 15,
          color: '#f97316',
          fillColor: '#f97316',
          fillOpacity: 0.08,
          weight: 1.5,
        }).addTo(map);
      } else {
        zoneCirclesRef.current.danger.setLatLng(vPos);
      }

      // Warning Zone (30m)
      if (!zoneCirclesRef.current.warning) {
        zoneCirclesRef.current.warning = L.circle(vPos, {
          radius: 30,
          color: '#eab308',
          fillColor: '#eab308',
          fillOpacity: 0.03,
          weight: 1.2,
          dashArray: '5, 5',
        }).addTo(map);
      } else {
        zoneCirclesRef.current.warning.setLatLng(vPos);
      }
    } else {
      if (zoneCirclesRef.current.critical) zoneCirclesRef.current.critical.remove();
      if (zoneCirclesRef.current.danger) zoneCirclesRef.current.danger.remove();
      if (zoneCirclesRef.current.warning) zoneCirclesRef.current.warning.remove();
      zoneCirclesRef.current = {};
    }
  }, [vehicle, followVehicle, showZones]);

  // Update Hazard Markers and Bearing Lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !vehicle) return;

    const currentHazardIds = new Set(hazards.map((h) => h.id));

    // Remove obsolete markers & lines
    hazardMarkersRef.current.forEach((marker, id) => {
      if (!currentHazardIds.has(id)) {
        marker.remove();
        hazardMarkersRef.current.delete(id);
      }
    });

    hazardLinesRef.current.forEach((line, id) => {
      if (!currentHazardIds.has(id)) {
        line.remove();
        hazardLinesRef.current.delete(id);
      }
    });

    // Color map based on risk & object type
    const getTypeColor = (type: Hazard['type'], risk: Hazard['riskLevel']) => {
      if (risk === 'CRITICAL') return '#dc2626'; // Red
      if (type === 'PERSON') return '#ef4444'; // Red
      if (type === 'DUMPER' || type === 'EXCAVATOR' || type === 'TRUCK') return '#f97316'; // Orange
      if (type === 'OBSTACLE') return '#eab308'; // Yellow
      if (type === 'THERMAL_HOTSPOT') return '#a855f7'; // Purple
      return '#3b82f6'; // Blue
    };

    const getTypeEmoji = (type: Hazard['type']) => {
      if (type === 'PERSON') return '🚶';
      if (type === 'DUMPER') return '🚛';
      if (type === 'EXCAVATOR') return '🏗';
      if (type === 'OBSTACLE') return '🪨';
      if (type === 'THERMAL_HOTSPOT') return '🔥';
      return '⚠️';
    };

    // Render or update each hazard
    hazards.forEach((hazard) => {
      const hPos: [number, number] = [hazard.latitude, hazard.longitude];
      const isSelected = selectedHazardId === hazard.id;
      const color = getTypeColor(hazard.type, hazard.riskLevel);
      const emoji = getTypeEmoji(hazard.type);

      const markerHtml = `
        <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
          <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:${color}33; border:1.5px solid ${color}; transform:${isSelected || hazard.riskLevel === 'CRITICAL' ? 'scale(1.3)' : 'scale(1)'}; transition:all 0.2s ease;"></div>
          <div style="width:24px; height:24px; border-radius:50%; background:#18181b; border:2px solid ${color}; display:flex; align-items:center; justify-content:center; font-size:12px; box-shadow:0 0 8px ${color}88;">
            ${emoji}
          </div>
          <div style="position:absolute; top:-14px; background:#09090b; border:1px solid ${color}; color:${color}; font-size:8px; font-weight:800; font-family:monospace; padding:0 3px; border-radius:2px; white-space:nowrap;">
            ${hazard.distanceM.toFixed(1)}m
          </div>
        </div>
      `;

      const hazardCustomIcon = L.divIcon({
        className: `hazard-marker-${hazard.id}`,
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      let marker = hazardMarkersRef.current.get(hazard.id);
      if (!marker) {
        marker = L.marker(hPos, { icon: hazardCustomIcon, zIndexOffset: 900 }).addTo(map);
        marker.on('click', () => {
          onSelectHazard(hazard.id);
        });
        hazardMarkersRef.current.set(hazard.id, marker);
      } else {
        marker.setLatLng(hPos);
        marker.setIcon(hazardCustomIcon);
      }

      // Popup Content
      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:190px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:${color}; font-size:12px;">${hazard.type} (${hazard.id})</strong>
            <span style="background:${color}22; color:${color}; border:1px solid ${color}; font-size:9px; font-weight:bold; padding:1px 4px; border-radius:3px;">
              ${hazard.riskLevel}
            </span>
          </div>
          <div style="font-size:11px; color:#d4d4d8; line-height:1.4;">
            <div>Distance: <strong>${hazard.distanceM.toFixed(1)} m</strong> (${hazard.dangerZone})</div>
            <div>Temp: <strong>${hazard.temperatureC.toFixed(1)} °C</strong> | Conf: <strong>${(hazard.confidence * 100).toFixed(0)}%</strong></div>
            <div>Position: <strong>${hazard.latitude.toFixed(6)}, ${hazard.longitude.toFixed(6)}</strong></div>
            <div>Bearing: <strong>${hazard.bearingDeg > 0 ? `+${hazard.bearingDeg}` : hazard.bearingDeg}°</strong></div>
            <div style="margin-top:4px; font-size:10px; color:#fbbf24;">${hazard.recommendedAction}</div>
          </div>
        </div>
      `);

      // Bearing lines from Vehicle to Hazard
      if (showLines) {
        const vPos: [number, number] = [vehicle.latitude, vehicle.longitude];
        let line = hazardLinesRef.current.get(hazard.id);
        if (!line) {
          line = L.polyline([vPos, hPos], {
            color: color,
            weight: hazard.riskLevel === 'CRITICAL' ? 2.5 : 1.5,
            opacity: 0.8,
            dashArray: hazard.riskLevel === 'CRITICAL' ? undefined : '4, 4',
          }).addTo(map);
          hazardLinesRef.current.set(hazard.id, line);
        } else {
          line.setLatLngs([vPos, hPos]);
          line.setStyle({
            color: color,
            weight: hazard.riskLevel === 'CRITICAL' ? 2.5 : 1.5,
          });
        }
      }
    });
  }, [hazards, vehicle, selectedHazardId, showLines, onSelectHazard]);

  return (
    <div className={`relative w-full overflow-hidden border border-[#1c2638] bg-[#080b10] chamfer-sm ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Status Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="bg-[#0b0f17]/95 border border-[#1c2638] px-3 py-1.5 chamfer-sm shadow-xl text-xs font-mono flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 bg-emerald-400 animate-pulse"></span>
          <span className="text-zinc-100 font-bold font-heading uppercase tracking-wider">BAILADILA OPEN-CAST MINE</span>
          <span className="text-zinc-600">|</span>
          <span className="text-amber-400 font-bold">BENCH #04 (+420m RL)</span>
        </div>

        <div className="bg-[#0b0f17]/95 border border-[#1c2638] px-3 py-1.5 chamfer-sm shadow-xl text-[11px] font-mono text-zinc-300 pointer-events-auto flex items-center gap-2">
          <span className="text-zinc-500">POS:</span>
          <strong className="text-amber-300">
            {vehicle?.latitude.toFixed(6) ?? '18.675230'}°N, {vehicle?.longitude.toFixed(6) ?? '81.245120'}°E
          </strong>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">HDG: {vehicle?.headingDeg.toFixed(0) ?? 72}°</span>
        </div>
      </div>

      {/* Top Right Controls Overlay */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <div className="bg-[#0b0f17]/95 border border-[#1c2638] chamfer-sm p-1 shadow-xl flex flex-col gap-1">
          <button
            onClick={() => {
              if (vehicle && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([vehicle.latitude, vehicle.longitude], 19, { duration: 0.8 });
                setFollowVehicle(true);
              }
            }}
            title="Recenter on Vehicle"
            className="p-2 chamfer-sm hover:bg-[#162032] text-amber-400 transition-colors flex items-center justify-center"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={() => setFollowVehicle(!followVehicle)}
            title={followVehicle ? 'Disable Auto-Follow' : 'Enable Auto-Follow'}
            className={`p-2 chamfer-sm text-xs transition-colors flex items-center justify-center ${
              followVehicle ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-zinc-400 hover:bg-[#162032]'
            }`}
          >
            <Navigation className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowZones(!showZones)}
            title="Toggle Safety Buffers (5m / 15m / 30m)"
            className={`p-2 chamfer-sm text-xs transition-colors flex items-center justify-center ${
              showZones ? 'bg-[#162032] text-emerald-400 border border-emerald-500/30' : 'text-zinc-500 hover:bg-[#162032]'
            }`}
          >
            <Shield className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
            }}
            title="Zoom In"
            className="p-2 chamfer-sm hover:bg-[#162032] text-zinc-300 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
            }}
            title="Zoom Out"
            className="p-2 chamfer-sm hover:bg-[#162032] text-zinc-300 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Left Map Legend */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-[#0b0f17]/95 border border-[#1c2638] chamfer-sm px-3 py-2 text-[11px] shadow-xl">
          <div className="font-heading font-black text-zinc-200 mb-1.5 flex items-center justify-between gap-4 uppercase tracking-wider">
            <span>[ GEO LEGEND ]</span>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="text-[10px] font-mono text-zinc-500 hover:text-amber-400"
            >
              {showLegend ? 'COLLAPSE' : 'EXPAND'}
            </button>
          </div>
          {showLegend && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-zinc-300 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                <span>Worker / Personnel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                <span>Heavy HEMM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>
                <span>Pit Boulder</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                <span>Thermal Spike</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-[#1c2638] text-[9px] text-zinc-400">
                <span>BUFFER: 🔴 0-5m | 🟠 5-15m | 🟡 15-30m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right Coordinate & Projection Datum */}
      <div className="absolute bottom-3 right-3 z-10 max-w-xs text-right pointer-events-none">
        <div className="bg-[#0b0f17]/90 border border-[#1c2638] px-2.5 py-1 chamfer-sm text-[9px] text-zinc-400 font-mono shadow-md">
          WGS-84 / UTM ZONE 44N • SIMULATION ACTIVE
        </div>
      </div>
    </div>
  );
};
