import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, CheckCircle2, Play, Radio, Music } from 'lucide-react';
import { soundManager, AudioFileStatus, AlertPriority } from '../../services/audio';

interface AudioControlPanelProps {
  compact?: boolean;
  className?: string;
}

export const AudioControlPanel: React.FC<AudioControlPanelProps> = ({
  compact = false,
  className = '',
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getIsMuted());
  const [fileStatus, setFileStatus] = useState<AudioFileStatus>(soundManager.getFileStatus());
  const [fileName, setFileName] = useState<string>(soundManager.getFileName());
  const [volume, setVolume] = useState<number>(soundManager.getVolume());
  const [activePriority, setActivePriority] = useState<AlertPriority>(soundManager.getCurrentPriority());
  const [isPlaying, setIsPlaying] = useState<boolean>(soundManager.isAlarmPlaying());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setIsMuted(soundManager.getIsMuted());
      setFileStatus(soundManager.getFileStatus());
      setFileName(soundManager.getFileName());
      setVolume(soundManager.getVolume());
      setActivePriority(soundManager.getCurrentPriority());
      setIsPlaying(soundManager.isAlarmPlaying());
    });
    return unsubscribe;
  }, []);

  const handleTestAlarm = () => {
    soundManager.testAlarm();
  };

  const handleMute = () => {
    soundManager.mute();
  };

  const handleUnmute = () => {
    soundManager.unmute();
  };

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundManager.setVolume(val);
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-[#080b10] border border-[#1c2638] chamfer-sm text-xs font-mono ${className}`}>
        {/* Status Indicator */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-400 font-bold uppercase">AUDIO:</span>
          {fileStatus === 'READY' ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              READY
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              {fileStatus === 'FILE_NOT_FOUND' ? 'FILE NOT FOUND' : 'LOADING'}
            </span>
          )}
        </div>

        <div className="h-4 w-px bg-[#1c2638]" />

        {/* Mute/Unmute state */}
        <div className="flex items-center gap-1">
          {isMuted ? (
            <button
              onClick={handleUnmute}
              title="Unmute Alert Sound"
              className="px-2 py-0.5 bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300 font-bold text-[10px] flex items-center gap-1 chamfer-sm"
            >
              <VolumeX className="w-3 h-3 text-red-400" />
              MUTED
            </button>
          ) : (
            <button
              onClick={handleMute}
              title="Mute Alert Sound"
              className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-bold text-[10px] flex items-center gap-1 chamfer-sm"
            >
              <Volume2 className="w-3 h-3 text-emerald-400" />
              ENABLED
            </button>
          )}
        </div>

        {/* Test Button */}
        <button
          onClick={handleTestAlarm}
          title="Play provided alert sound: universfield-digital-alarm-clock-151920.mp3.mpeg"
          className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase font-mono tracking-wider chamfer-sm flex items-center gap-1 transition-colors active:scale-95"
        >
          <Play className="w-2.5 h-2.5 fill-black" />
          TEST
        </button>
      </div>
    );
  }

  return (
    <div className={`tech-panel p-3.5 chamfer-sm space-y-3 ${className}`}>
      {/* Top Header & Status Grid */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162032] pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 chamfer-sm border ${
            isMuted
              ? 'bg-zinc-900/80 text-zinc-500 border-zinc-700'
              : isPlaying
              ? 'bg-red-500/20 text-red-400 border-red-500/60 animate-pulse'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}>
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                🔊 ALERT SOUND
              </h3>
              {isMuted ? (
                <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-red-950/90 text-red-300 border border-red-500/60 chamfer-sm flex items-center gap-1">
                  ● MUTED
                </span>
              ) : (
                <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 chamfer-sm flex items-center gap-1">
                  ● ENABLED
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
              <span>ACTIVE PRIORITY: <strong className={
                activePriority === 'CRITICAL' ? 'text-red-400 font-black' :
                activePriority === 'HIGH' ? 'text-orange-400 font-bold' :
                activePriority === 'WARNING' ? 'text-amber-400 font-bold' : 'text-zinc-500'
              }>{activePriority}</strong></span>
              {isPlaying && (
                <span className="text-[9px] px-1.5 py-0.2 bg-red-600 text-white font-black chamfer-sm animate-pulse">
                  PLAYING
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Audio File Status Display */}
        <div className="bg-[#080b10] border border-[#1c2638] px-3.5 py-2 chamfer-sm text-xs font-mono">
          <div className="text-[9px] text-zinc-500 uppercase font-bold">ALERT AUDIO</div>
          {fileStatus === 'READY' ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>● READY</span>
            </div>
          ) : fileStatus === 'FILE_NOT_FOUND' ? (
            <div className="flex items-center gap-1.5 text-red-400 font-bold mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>⚠ FILE NOT FOUND</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 font-bold mt-0.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>● LOADING AUDIO...</span>
            </div>
          )}
        </div>
      </div>

      {/* Embedded File Metadata & Local Offline Notice */}
      <div className="bg-[#05070a] border border-[#162032] p-2 chamfer-sm flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-400">
          <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[10px] truncate max-w-sm sm:max-w-md">
            BUNDLED FILE: <strong className="text-zinc-200">{fileName}</strong>
          </span>
        </div>
        <span className="text-[9px] text-zinc-500 bg-[#080b10] px-2 py-0.5 border border-[#1c2638] chamfer-sm font-bold">
          OFFLINE ZERO-DEPENDENCY BUNDLE
        </span>
      </div>

      {/* Control Buttons & Volume Slider */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Button Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Test Alarm Button */}
          <button
            onClick={handleTestAlarm}
            title="Play provided audio file: universfield-digital-alarm-clock-151920.mp3.mpeg"
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase font-mono tracking-wider chamfer-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>[ 🔊 TEST ALARM ]</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={handleMute}
            disabled={isMuted}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase chamfer-sm flex items-center gap-1.5 transition-colors border ${
              isMuted
                ? 'bg-zinc-900/50 text-zinc-600 border-zinc-800 cursor-not-allowed'
                : 'bg-red-950/80 hover:bg-red-900 text-red-200 border-red-500/60 active:scale-95'
            }`}
          >
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
            <span>[ 🔇 MUTE ]</span>
          </button>

          {/* Unmute Button */}
          <button
            onClick={handleUnmute}
            disabled={!isMuted}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase chamfer-sm flex items-center gap-1.5 transition-colors border ${
              !isMuted
                ? 'bg-zinc-900/50 text-zinc-600 border-zinc-800 cursor-not-allowed'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-500/60 active:scale-95'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>[ 🔊 UNMUTE ]</span>
          </button>
        </div>

        {/* Master Gain Volume Slider */}
        <div className="flex items-center gap-2 bg-[#080b10] border border-[#1c2638] px-3 py-1 chamfer-sm text-xs font-mono">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">GAIN:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeSlider}
            disabled={isMuted}
            className="w-24 cursor-pointer"
            title={`Master Volume: ${Math.round(volume * 100)}%`}
          />
          <span className="text-xs text-amber-400 font-bold font-mono w-8 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
