import React, { useRef, useEffect, useState } from 'react';
import { Flame, Crosshair, RefreshCw, Eye, Sliders, Maximize2 } from 'lucide-react';
import { Hazard, ThermalPalette } from '../../types';

interface ThermalCameraFeedProps {
  hazards: Hazard[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string) => void;
  className?: string;
}

export const ThermalCameraFeed: React.FC<ThermalCameraFeedProps> = ({
  hazards,
  selectedHazardId,
  onSelectHazard,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [palette, setPalette] = useState<ThermalPalette>('ironbow');
  const [spotTemp, setSpotTemp] = useState<{ x: number; y: number; temp: number } | null>(null);
  const [fps, setFps] = useState<number>(30);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(true);

  // Compute thermal stats
  let maxTemp = 28.5;
  let minTemp = 18.2;
  let avgTemp = 23.4;

  hazards.forEach((h) => {
    if (h.temperatureC > maxTemp) maxTemp = h.temperatureC;
    if (h.temperatureC < minTemp) minTemp = h.temperatureC;
  });

  // Canvas Thermal Simulation Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const renderThermalFrame = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw baseline ambient background with noise/fog thermal gradient
      const time = Date.now() / 1000;
      const baseGradient = ctx.createLinearGradient(0, 0, 0, height);

      if (palette === 'ironbow') {
        baseGradient.addColorStop(0, '#10002b');
        baseGradient.addColorStop(0.5, '#240046');
        baseGradient.addColorStop(1, '#3c096c');
      } else if (palette === 'rainbow') {
        baseGradient.addColorStop(0, '#03045e');
        baseGradient.addColorStop(0.5, '#0077b6');
        baseGradient.addColorStop(1, '#0096c7');
      } else if (palette === 'whitehot') {
        baseGradient.addColorStop(0, '#18181b');
        baseGradient.addColorStop(1, '#27272a');
      } else {
        // blackhot
        baseGradient.addColorStop(0, '#e4e4e7');
        baseGradient.addColorStop(1, '#d4d4d8');
      }

      ctx.fillStyle = baseGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle thermal noise texture
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 8;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      // 2. Draw Thermal Heat Signatures for each detected hazard
      hazards.forEach((hazard) => {
        const hx = hazard.pixelX ? (hazard.pixelX / 640) * width : width * 0.5;
        const hy = hazard.pixelY ? (hazard.pixelY / 480) * height : height * 0.5;
        const isPerson = hazard.type === 'PERSON';
        const isHotspot = hazard.type === 'THERMAL_HOTSPOT' || hazard.temperatureC > 60;
        const isHeavy = hazard.type === 'DUMPER' || hazard.type === 'EXCAVATOR';

        const radius = isHeavy ? 65 : isPerson ? 35 : isHotspot ? 45 : 25;

        // Radial heat gradient for object
        const heatGrad = ctx.createRadialGradient(hx, hy, 2, hx, hy, radius);

        if (palette === 'ironbow') {
          if (isHotspot || hazard.temperatureC > 70) {
            heatGrad.addColorStop(0, '#ffffff');
            heatGrad.addColorStop(0.3, '#ffea00');
            heatGrad.addColorStop(0.6, '#ff5400');
            heatGrad.addColorStop(0.85, '#9d0208');
            heatGrad.addColorStop(1, 'rgba(36, 0, 70, 0)');
          } else if (isPerson) {
            // Body temp ~37°C
            heatGrad.addColorStop(0, '#ffea00');
            heatGrad.addColorStop(0.4, '#ff7b00');
            heatGrad.addColorStop(0.7, '#e85d04');
            heatGrad.addColorStop(1, 'rgba(60, 9, 108, 0)');
          } else {
            heatGrad.addColorStop(0, '#ff9e00');
            heatGrad.addColorStop(0.5, '#d00000');
            heatGrad.addColorStop(1, 'rgba(36, 0, 70, 0)');
          }
        } else if (palette === 'rainbow') {
          heatGrad.addColorStop(0, '#ffffff');
          heatGrad.addColorStop(0.2, '#ff0000');
          heatGrad.addColorStop(0.5, '#ffff00');
          heatGrad.addColorStop(0.8, '#00ff00');
          heatGrad.addColorStop(1, 'rgba(0, 119, 182, 0)');
        } else if (palette === 'whitehot') {
          heatGrad.addColorStop(0, '#ffffff');
          heatGrad.addColorStop(0.5, '#cccccc');
          heatGrad.addColorStop(1, 'rgba(39, 39, 42, 0)');
        } else {
          // blackhot
          heatGrad.addColorStop(0, '#000000');
          heatGrad.addColorStop(0.5, '#444444');
          heatGrad.addColorStop(1, 'rgba(212, 212, 216, 0)');
        }

        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw Bounding Boxes if enabled
        if (showBoundingBoxes) {
          const isSelected = selectedHazardId === hazard.id;
          const boxW = radius * 1.8;
          const boxH = radius * 2.2;
          const bx = hx - boxW / 2;
          const by = hy - boxH / 2;

          ctx.strokeStyle = hazard.riskLevel === 'CRITICAL' ? '#ef4444' : isSelected ? '#fbbf24' : '#22c55e';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.strokeRect(bx, by, boxW, boxH);

          // Corner brackets
          const cornerLen = 8;
          ctx.beginPath();
          // Top Left
          ctx.moveTo(bx, by + cornerLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerLen, by);
          // Top Right
          ctx.moveTo(bx + boxW - cornerLen, by); ctx.lineTo(bx + boxW, by); ctx.lineTo(bx + boxW, by + cornerLen);
          // Bottom Left
          ctx.moveTo(bx, by + boxH - cornerLen); ctx.lineTo(bx, by + boxH); ctx.lineTo(bx + cornerLen, by + boxH);
          // Bottom Right
          ctx.moveTo(bx + boxW - cornerLen, by + boxH); ctx.lineTo(bx + boxW, by + boxH); ctx.lineTo(bx + boxW, by + boxH - cornerLen);
          ctx.stroke();

          // Label Badge
          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx.fillRect(bx, by - 22, boxW, 20);
          ctx.strokeStyle = ctx.strokeStyle;
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, by - 22, boxW, 20);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`${hazard.type} ${hazard.distanceM.toFixed(1)}m`, bx + 4, by - 8);

          // Spot Temp readout on top
          ctx.fillStyle = hazard.temperatureC > 45 ? '#f87171' : '#fef08a';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`${hazard.temperatureC.toFixed(1)}°C (${(hazard.confidence * 100).toFixed(0)}%)`, bx + 4, by + boxH + 12);
        }
      });

      // 4. Draw Center Crosshair
      if (showCrosshairs) {
        const cx = width / 2;
        const cy = height / 2;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Crosshair reticle
        ctx.moveTo(cx - 15, cy); ctx.lineTo(cx - 4, cy);
        ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 15, cy);
        ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy - 4);
        ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 15);
        ctx.stroke();
      }

      // 5. Draw interactive spot probe if active
      if (spotTemp) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(spotTemp.x, spotTemp.y, 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(spotTemp.x + 8, spotTemp.y - 12, 60, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`${spotTemp.temp.toFixed(1)}°C`, spotTemp.x + 12, spotTemp.y);
      }

      // Scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }
    };

    renderThermalFrame();
    const interval = setInterval(renderThermalFrame, 33); // ~30 FPS

    return () => {
      clearInterval(interval);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [hazards, palette, selectedHazardId, showBoundingBoxes, showCrosshairs, spotTemp]);

  // Handle canvas mouse move for interactive spot temp measurement
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Estimate temperature at cursor based on distance to known hazard heat sources
    let cursorTemp = 21.5 + (Math.random() - 0.5) * 0.4;
    hazards.forEach((h) => {
      const hx = (h.pixelX / 640) * canvas.width;
      const hy = (h.pixelY / 480) * canvas.height;
      const dist = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);
      if (dist < 60) {
        const influence = (1 - dist / 60) * (h.temperatureC - 21.5);
        cursorTemp += influence;
      }
    });

    setSpotTemp({ x, y, temp: cursorTemp });
  };

  const handleCanvasMouseLeave = () => {
    setSpotTemp(null);
  };

  return (
    <div className={`tech-panel chamfer-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#0b0f17] border-b border-[#1c2638] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-purple-500/20 border border-purple-500/40 chamfer-sm text-purple-300">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
            THERMAL LWIR SENSOR (640×480)
          </span>
          <span className="text-[9px] px-1.5 py-0.2 chamfer-sm bg-[#162032] border border-[#243147] text-purple-300 font-mono font-bold">
            30 FPS • 8-14µm
          </span>
        </div>

        {/* Palette & Overlay Controls */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <div className="flex items-center bg-[#080b10] border border-[#1c2638] chamfer-sm p-0.5">
            {(['ironbow', 'rainbow', 'whitehot', 'blackhot'] as ThermalPalette[]).map((p) => (
              <button
                key={p}
                onClick={() => setPalette(p)}
                className={`px-2 py-0.5 text-[9px] chamfer-sm uppercase font-bold transition-colors ${
                  palette === p
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p.slice(0, 4)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            title="Toggle AI Object Detection Boxes"
            className={`px-2 py-1 chamfer-sm border text-[9px] font-mono font-bold ${
              showBoundingBoxes
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-[#080b10] border-[#1c2638] text-zinc-500'
            }`}
          >
            AI BBOX: {showBoundingBoxes ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 min-h-[220px] bg-[#05070a] flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          className="w-full h-full object-cover cursor-crosshair"
        />

        {/* Simulated Thermal Feed Watermark */}
        <div className="absolute top-2 left-2 bg-[#080b10]/90 border border-[#1c2638] px-2 py-0.5 chamfer-sm text-[9px] font-mono text-zinc-300 flex items-center gap-1.5 shadow-md">
          <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-zinc-200">[ GERMANIUM OPTICS // ACTIVE ]</span>
        </div>

        {/* Spot Temperature probe HUD */}
        {spotTemp && (
          <div
            className="absolute pointer-events-none bg-[#080b10]/95 border border-purple-500/80 px-2 py-0.5 chamfer-sm text-[9px] font-mono text-purple-200 shadow-xl"
            style={{
              left: Math.min(spotTemp.x + 10, 520),
              top: Math.min(spotTemp.y + 10, 340),
            }}
          >
            PROBE: <strong>{spotTemp.temp.toFixed(1)}°C</strong>
          </div>
        )}

        {/* Right Vertical Temperature Scale Bar */}
        <div className="absolute right-2 top-2 bottom-2 w-6 bg-[#080b10]/90 border border-[#1c2638] chamfer-sm flex flex-col items-center justify-between p-1 text-[9px] font-mono text-zinc-300 shadow-lg">
          <span className="text-red-400 font-bold">{maxTemp.toFixed(0)}°</span>
          <div
            className="w-2 flex-1 my-1 rounded-none border border-[#1c2638]"
            style={{
              background:
                palette === 'ironbow'
                  ? 'linear-gradient(to bottom, #ffffff, #ffea00, #ff5400, #9d0208, #240046)'
                  : palette === 'rainbow'
                  ? 'linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff)'
                  : palette === 'whitehot'
                  ? 'linear-gradient(to bottom, #ffffff, #888888, #18181b)'
                  : 'linear-gradient(to bottom, #000000, #888888, #ffffff)',
            }}
          />
          <span className="text-sky-400 font-bold">{minTemp.toFixed(0)}°</span>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="px-3 py-2 bg-[#080b10] border-t border-[#1c2638] grid grid-cols-4 gap-2 text-center text-xs font-mono">
        <div className="border-r border-[#161f2e] pr-1">
          <span className="text-[9px] text-zinc-500 block uppercase font-bold">MAX TEMP</span>
          <span className="font-bold text-red-400 text-sm">{maxTemp.toFixed(1)}°C</span>
        </div>
        <div className="border-r border-[#161f2e] pr-1">
          <span className="text-[9px] text-zinc-500 block uppercase font-bold">AVG AMBIENT</span>
          <span className="font-bold text-zinc-200 text-sm">{avgTemp.toFixed(1)}°C</span>
        </div>
        <div className="border-r border-[#161f2e] pr-1">
          <span className="text-[9px] text-zinc-500 block uppercase font-bold">MIN TEMP</span>
          <span className="font-bold text-sky-400 text-sm">{minTemp.toFixed(1)}°C</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-500 block uppercase font-bold">HOTSPOTS</span>
          <span className="font-bold text-amber-400 text-sm">{hazards.length.toString().padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
};
