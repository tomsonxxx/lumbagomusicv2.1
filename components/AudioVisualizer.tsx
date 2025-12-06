
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isPlaying, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Dopasuj rozmiar canvas
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;

      ctx.clearRect(0, 0, width, height);

      // --- NEON EFFECTS CONFIG ---
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#8ef0ff'; // Cyan glow
      ctx.globalCompositeOperation = 'screen'; // Additive blending for glow

      // Use fewer bars for cleaner look (mirrored)
      const barsToDraw = 64; 
      const step = Math.floor(bufferLength / barsToDraw);
      const barWidth = (width / barsToDraw) / 2.2; 
      
      const centerX = width / 2;

      for (let i = 0; i < barsToDraw; i++) {
        // Average value for smoother bars
        let value = 0;
        for(let j=0; j<step; j++) {
            value += dataArray[i * step + j];
        }
        value = value / step;

        // Scale height
        const barHeight = (value / 255) * height * 0.8;
        
        // Dynamic Gradient
        // Map index to hue
        const hue = 180 + (i / barsToDraw) * 120; // 180 (Cyan) -> 300 (Purple)
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

        // Draw Right Side
        const xRight = centerX + (i * (barWidth + 2));
        ctx.beginPath();
        ctx.roundRect(xRight, (height - barHeight) / 2, barWidth, barHeight, 2);
        ctx.fill();

        // Draw Left Side (Mirrored)
        const xLeft = centerX - (i * (barWidth + 2)) - barWidth;
        ctx.beginPath();
        ctx.roundRect(xLeft, (height - barHeight) / 2, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`${className} w-full h-full`}
    />
  );
};

export default AudioVisualizer;
