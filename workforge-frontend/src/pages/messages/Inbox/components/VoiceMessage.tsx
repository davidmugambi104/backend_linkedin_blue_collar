import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface VoiceMessageProps {
  audioUrl: string;
  duration?: number;
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ audioUrl, duration = 0 }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!waveformRef.current || !audioUrl) {
      return;
    }

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4F46E5',
      progressColor: '#818CF8',
      cursorColor: 'transparent',
      barWidth: 2,
      barRadius: 3,
      height: 30,
    });

    wavesurferRef.current = wavesurfer;
    wavesurfer.load(audioUrl);

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('timeupdate', (time) => setCurrentTime(time));

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
      <button
        type="button"
        onClick={() => wavesurferRef.current?.playPause()}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white"
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      <div ref={waveformRef} className="flex-1" />

      <span className="text-xs text-slate-500">
        {formatTime(currentTime)}/{formatTime(duration)}
      </span>
    </div>
  );
};
