import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface FractalDotGridProps {
  dotSize?: number;
  dotSpacing?: number;
  dotOpacity?: number;
  waveIntensity?: number;
  waveRadius?: number;
  dotColor?: string;
  glowColor?: string;
  enableNoise?: boolean;
  noiseOpacity?: number;
  enableMouseGlow?: boolean;
  initialPerformance?: 'low' | 'medium' | 'high';
}

const NoiseSVG = React.memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <filter id="fractal-noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#fractal-noise)" />
  </svg>
));
NoiseSVG.displayName = 'NoiseSVG';

const NoiseOverlay: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div className="absolute inset-0 h-full w-full mix-blend-overlay" style={{ opacity }}>
    <NoiseSVG />
  </div>
);

const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
  };
};

const usePerformance = (initial: 'low' | 'medium' | 'high' = 'medium') => {
  const [perf, setPerf] = useState(initial);
  const [fps, setFps] = useState(60);
  useEffect(() => {
    let count = 0;
    let last = performance.now();
    let id: number;
    const measure = (t: number) => {
      count++;
      if (t - last > 1000) {
        setFps(Math.round((count * 1000) / (t - last)));
        count = 0;
        last = t;
      }
      id = requestAnimationFrame(measure);
    };
    id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (fps < 30) setPerf('low');
    else if (fps < 50) setPerf('medium');
    else setPerf('high');
  }, [fps]);
  return perf;
};

const DotCanvas: React.FC<{
  dotSize: number;
  dotSpacing: number;
  dotOpacity: number;
  waveIntensity: number;
  waveRadius: number;
  dotColor: string;
  glowColor: string;
  perf: 'low' | 'medium' | 'high';
  mousePos: { x: number; y: number };
}> = React.memo(({ dotSize, dotSpacing, dotOpacity, waveIntensity, waveRadius, dotColor, glowColor, perf, mousePos }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);
      const skip = perf === 'low' ? 3 : perf === 'medium' ? 2 : 1;
      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);
      const cx = mousePos.x * width;
      const cy = mousePos.y * height;

      for (let i = 0; i < cols; i += skip) {
        for (let j = 0; j < rows; j += skip) {
          const x = i * dotSpacing;
          const y = j * dotSpacing;
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let dotX = x;
          let dotY = y;

          if (dist < waveRadius) {
            const strength = Math.pow(1 - dist / waveRadius, 2);
            const angle = Math.atan2(dy, dx);
            const offset = Math.sin(dist * 0.05 - time * 0.005) * waveIntensity * strength;
            dotX += Math.cos(angle) * offset;
            dotY += Math.sin(angle) * offset;
            const gr = dotSize * (1 + strength);
            const grad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, gr);
            grad.addColorStop(0, glowColor.replace('1)', `${dotOpacity * (1 + strength)})`));
            grad.addColorStop(1, glowColor.replace('1)', '0)'));
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = dotColor.replace('1)', `${dotOpacity})`);
          }

          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [dotSize, dotSpacing, dotOpacity, waveIntensity, waveRadius, dotColor, glowColor, perf, mousePos]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    let last = 0;
    const animate = (t: number) => {
      if (t - last > 16) { draw(ctx, t); last = t; }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
});
DotCanvas.displayName = 'DotCanvas';

const MouseGlow: React.FC<{ glowColor: string; mousePos: { x: number; y: number } }> = React.memo(
  ({ glowColor, mousePos }) => (
    <>
      <div
        className="pointer-events-none absolute h-40 w-40 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor.replace('1)', '0.15)')} 0%, ${glowColor.replace('1)', '0)')} 70%)`,
          left: `${mousePos.x * 100}%`,
          top: `${mousePos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(10px)',
        }}
      />
      <div
        className="pointer-events-none absolute h-20 w-20 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor.replace('1)', '0.3)')} 0%, ${glowColor.replace('1)', '0)')} 70%)`,
          left: `${mousePos.x * 100}%`,
          top: `${mousePos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </>
  )
);
MouseGlow.displayName = 'MouseGlow';

export function FractalDotGrid({
  dotSize = 2,
  dotSpacing = 28,
  dotOpacity = 0.25,
  waveIntensity = 20,
  waveRadius = 180,
  dotColor = 'rgba(179, 197, 255, 1)',
  glowColor = 'rgba(179, 197, 255, 1)',
  enableNoise = false,
  noiseOpacity = 0.03,
  enableMouseGlow = true,
  initialPerformance = 'medium',
}: FractalDotGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useResponsive();
  const perf = usePerformance(initialPerformance);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 };
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const rDotSize = useMemo(() => isMobile ? dotSize * 0.75 : isTablet ? dotSize * 0.9 : dotSize, [isMobile, isTablet, dotSize]);
  const rSpacing = useMemo(() => isMobile ? dotSpacing * 1.5 : isTablet ? dotSpacing * 1.25 : dotSpacing, [isMobile, isTablet, dotSpacing]);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        key="fractal-dot-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0 h-full w-full overflow-hidden"
      >
        <DotCanvas
          dotSize={rDotSize}
          dotSpacing={rSpacing}
          dotOpacity={dotOpacity}
          waveIntensity={waveIntensity}
          waveRadius={waveRadius}
          dotColor={dotColor}
          glowColor={glowColor}
          perf={perf}
          mousePos={mousePos}
        />
        {enableNoise && <NoiseOverlay opacity={noiseOpacity} />}
        {enableMouseGlow && <MouseGlow glowColor={glowColor} mousePos={mousePos} />}
      </motion.div>
    </AnimatePresence>
  );
}

export default FractalDotGrid;
