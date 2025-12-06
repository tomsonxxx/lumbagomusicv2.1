
import React, { useState, useRef, useEffect } from 'react';

interface BpmTapButtonProps {
  onBpmDetected: (bpm: number) => void;
}

const BpmTapButton: React.FC<BpmTapButtonProps> = ({ onBpmDetected }) => {
  const [taps, setTaps] = useState<number[]>([]);
  const [displayBpm, setDisplayBpm] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleTap = (e?: React.MouseEvent) => {
    e?.preventDefault();
    const now = Date.now();
    
    setTaps(prevTaps => {
      // Reset if too much time passed (2 seconds)
      if (prevTaps.length > 0 && now - prevTaps[prevTaps.length - 1] > 2000) {
        return [now];
      }
      
      const newTaps = [...prevTaps, now];
      // Keep last 8 taps for rolling average
      if (newTaps.length > 8) newTaps.shift();
      
      if (newTaps.length > 1) {
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval);
        setDisplayBpm(calculatedBpm);
        onBpmDetected(calculatedBpm);
      }
      return newTaps;
    });
    
    // Visual feedback animation
    if (buttonRef.current) {
        buttonRef.current.classList.remove('animate-pulse-fast');
        void buttonRef.current.offsetWidth; // trigger reflow
        buttonRef.current.classList.add('animate-pulse-fast');
    }
  };

  return (
    <div className="flex flex-col items-center">
        <button
            ref={buttonRef}
            type="button"
            onClick={handleTap}
            className="px-3 py-2 bg-lumbago-dark border border-lumbago-secondary text-lumbago-secondary hover:bg-lumbago-secondary hover:text-lumbago-dark font-bold rounded transition-colors text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(255,102,204,0.1)] active:scale-95"
        >
            TAP BPM
        </button>
        {displayBpm && (
            <span className="text-xs text-lumbago-secondary mt-1 font-mono">{displayBpm}</span>
        )}
        <style>{`
            .animate-pulse-fast {
                animation: pulse-fast 0.1s ease-out;
            }
            @keyframes pulse-fast {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); opacity: 0.8; }
                100% { transform: scale(1); }
            }
        `}</style>
    </div>
  );
};

export default BpmTapButton;
