
import React, { useEffect, useRef, useState } from 'react';
import { AudioFile } from '../types';
import AlbumCover from './AlbumCover';
import AudioVisualizer from './AudioVisualizer';

interface GlobalPlayerProps {
  currentFile: AudioFile | null;
  isPlaying: boolean;
  volume: number;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

const GlobalPlayer: React.FC<GlobalPlayerProps> = ({
  currentFile,
  isPlaying,
  volume,
  onPlayPause,
  onVolumeChange,
  onNext,
  onPrev,
  onClose
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Inicjalizacja Web Audio API
  useEffect(() => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 512; // Increased for better resolution
      analyserNode.smoothingTimeConstant = 0.8;
      
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyserNode);
      analyserNode.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyserNode;
      setAnalyser(analyserNode);
    }
  }, [currentFile]); 

  // Obsługa zmiany pliku
  useEffect(() => {
    if (currentFile) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      const newUrl = URL.createObjectURL(currentFile.file);
      setBlobUrl(newUrl);
    }
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [currentFile?.id]);

  // Sterowanie odtwarzaniem
  useEffect(() => {
    if (!audioRef.current || !blobUrl) return;

    if (audioRef.current.src !== blobUrl) {
       audioRef.current.src = blobUrl;
       audioRef.current.load();
    }

    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [blobUrl, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  if (!currentFile) return null;

  const displayTags = currentFile.fetchedTags || currentFile.originalTags;
  const title = displayTags.title || currentFile.file.name;
  const artist = displayTags.artist || 'Nieznany Artysta';

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full h-full flex items-center px-6 relative animate-slide-up overflow-hidden">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
        onLoadedMetadata={handleTimeUpdate}
      />
      
      {/* Background glow behind player */}
      <div className="absolute inset-0 bg-lumbago-primary/5 blur-3xl pointer-events-none"></div>

      {/* LASER Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-900 group cursor-pointer z-50" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const pct = x / rect.width;
          if (audioRef.current && duration) {
              audioRef.current.currentTime = pct * duration;
          }
      }}>
          {/* Laser Glow */}
          <div 
            className="h-full bg-cyan-400 relative shadow-[0_0_10px_#22d3ee,0_0_20px_#22d3ee]"
            style={{ width: `${progressPercent}%` }}
          >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#fff] opacity-0 group-hover:opacity-100 transition-opacity transform scale-150"></div>
          </div>
      </div>

      {/* Info & Cover */}
      <div className="flex items-center w-1/4 min-w-[250px] gap-4 z-10">
         <div className="relative group perspective-500">
            <div className={`transition-all duration-1000 ${isPlaying ? 'animate-pulse-shadow' : ''}`}>
                <AlbumCover tags={displayTags} className="w-14 h-14 rounded-lg border border-white/20" />
            </div>
            <button onClick={onClose} className="absolute -top-2 -right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
         </div>
         <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
                <span className="font-bold text-white truncate text-sm neon-text tracking-wide">{title}</span>
            </div>
            <span className="text-xs text-cyan-300/80 truncate font-mono">{artist}</span>
         </div>
      </div>

      {/* Controls - Center */}
      <div className="flex flex-col items-center flex-grow max-w-xl z-10">
         <div className="flex items-center gap-8 mb-1">
            <button onClick={onPrev} className="text-slate-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all transform hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <button 
              onClick={onPlayPause} 
              className="w-12 h-12 rounded-full bg-black border border-cyan-500/50 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:scale-105 transition-all shadow-lg"
            >
               {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
               ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 pl-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
               )}
            </button>

            <button onClick={onNext} className="text-slate-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all transform hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
         </div>
         
         <div className="w-full flex items-center justify-between text-[10px] text-cyan-500/50 font-mono mt-1 tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
         </div>
      </div>

      {/* Visualizer & Volume */}
      <div className="flex items-center w-1/4 justify-end gap-6 pl-4 z-10">
         {/* Waveform Container */}
         <div className="hidden lg:block w-40 h-12 bg-black/60 rounded border border-white/10 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <AudioVisualizer analyser={analyser} isPlaying={isPlaying} />
         </div>

         <div className="flex items-center gap-2 group relative">
             <button onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)} className="hover:text-white transition-colors text-slate-400">
                {volume === 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
             </button>
             <div className="w-24 h-1 bg-slate-700 rounded-lg cursor-pointer relative overflow-hidden group/vol">
                 <input
                   type="range"
                   min="0"
                   max="1"
                   step="0.01"
                   value={volume}
                   onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div className="h-full bg-cyan-500 relative box-shadow-[0_0_10px_#06b6d4]" style={{width: `${volume * 100}%`}}>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover/vol:opacity-100 transition-opacity shadow-[0_0_10px_white]"></div>
                 </div>
             </div>
         </div>
      </div>
      
      <style>{`
        @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
        }
        @keyframes pulse-shadow {
            0%, 100% { box-shadow: 0 0 10px rgba(142, 240, 255, 0.2); }
            50% { box-shadow: 0 0 25px rgba(142, 240, 255, 0.6); }
        }
        .animate-pulse-shadow {
            animation: pulse-shadow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default GlobalPlayer;
