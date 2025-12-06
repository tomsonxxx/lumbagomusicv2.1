
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
      // Lazy init context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
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

  // Obliczanie postępu paska
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full h-full flex items-center px-6 relative animate-slide-up">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
        onLoadedMetadata={handleTimeUpdate}
      />
      
      {/* Pasek postępu na samej górze docka */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800 group cursor-pointer" onClick={(e) => {
          // Kliknięcie w pasek (prosta obsługa seek)
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const pct = x / rect.width;
          if (audioRef.current && duration) {
              audioRef.current.currentTime = pct * duration;
          }
      }}>
          <div 
            className="h-full bg-gradient-to-r from-lumbago-primary to-lumbago-secondary relative"
            style={{ width: `${progressPercent}%` }}
          >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
      </div>

      {/* Info & Cover */}
      <div className="flex items-center w-1/4 min-w-[250px] gap-4">
         <div className="relative group">
            <AlbumCover tags={displayTags} className="w-14 h-14 rounded-lg shadow-lg border border-white/10" />
            <button onClick={onClose} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
         </div>
         <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
                <span className="font-bold text-white truncate text-sm neon-text">{title}</span>
            </div>
            <span className="text-xs text-lumbago-text-dim truncate">{artist}</span>
         </div>
      </div>

      {/* Controls - Center */}
      <div className="flex flex-col items-center flex-grow max-w-xl">
         <div className="flex items-center gap-8 mb-1">
            <button onClick={onPrev} className="text-slate-400 hover:text-white hover:drop-shadow-[0_0_5px_#fff] transition-all transform hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <button 
              onClick={onPlayPause} 
              className="w-12 h-12 rounded-full bg-gradient-to-br from-lumbago-primary to-[#4fd1ff] text-lumbago-dark flex items-center justify-center hover:shadow-[0_0_20px_rgba(142,240,255,0.5)] hover:scale-105 transition-all shadow-lg"
            >
               {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
               ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 pl-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
               )}
            </button>

            <button onClick={onNext} className="text-slate-400 hover:text-white hover:drop-shadow-[0_0_5px_#fff] transition-all transform hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
         </div>
         
         <div className="w-full flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
         </div>
      </div>

      {/* Visualizer & Volume */}
      <div className="flex items-center w-1/4 justify-end gap-6 pl-4">
         {/* Waveform Container */}
         <div className="hidden lg:block w-32 h-10 bg-black/40 rounded border border-white/5 overflow-hidden">
            <AudioVisualizer analyser={analyser} isPlaying={isPlaying} />
         </div>

         <div className="flex items-center gap-2 group relative">
             <button onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)}>
                {volume === 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-lumbago-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
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
                 <div className="h-full bg-lumbago-primary relative" style={{width: `${volume * 100}%`}}>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover/vol:opacity-100 transition-opacity"></div>
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
      `}</style>
    </div>
  );
};

export default GlobalPlayer;
