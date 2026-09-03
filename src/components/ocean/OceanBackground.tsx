import React, { useEffect, useRef } from 'react';
import { useOceanDepth, OceanZoneId } from '../../context/OceanDepthContext.js';
import {
  SeaTurtleIllustration,
  MantaRayIllustration,
  LanternfishIllustration,
  CombJellyIllustration,
  GiantSquidIllustration,
  AnglerfishIllustration,
  HadalSnailfishIllustration,
} from './MarineLifeIllustrations.js';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
  type: 'bubble' | 'snow' | 'bioluminescent';
}

export const OceanBackground: React.FC = () => {
  const { depth, zone, zoneProgress } = useOceanDepth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background gradient color interpolation based on depth
  const getGradientStyle = () => {
    if (depth <= 50) {
      // Surface: Sunlit oceanic blue with gentle light
      return 'linear-gradient(180deg, #0A2239 0%, #062B45 50%, #051F33 100%)';
    }
    if (depth <= 200) {
      // Shallow Water: Rich cyan-navy, filtered light
      return 'linear-gradient(180deg, #062B45 0%, #051F33 60%, #041624 100%)';
    }
    if (depth <= 1000) {
      // Twilight Zone: Dimming indigo, mysterious blue
      return 'linear-gradient(180deg, #051F33 0%, #041424 60%, #030F1C 100%)';
    }
    if (depth <= 4000) {
      // Deep Ocean: Inky midnight navy, high contrast
      return 'linear-gradient(180deg, #041424 0%, #030C17 60%, #02070E 100%)';
    }
    // Hadal Abyss: Deepest black with subtle cyan whisper
    return 'linear-gradient(180deg, #030C17 0%, #02070E 50%, #010408 100%)';
  };

  // High-performance particle canvas: adapts particle types based on depth
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize 65 organic particles
    const particleCount = 65;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.8,
        speedY: (Math.random() - 0.5) * 0.4,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
        type: i % 3 === 0 ? 'bubble' : i % 2 === 0 ? 'bioluminescent' : 'snow',
      });
    }

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Particles behavior shifts as we go deeper
        if (depth <= 200) {
          // Surface/Shallow: bubbles float upwards gently
          p.y -= Math.abs(p.speedY) * 0.8 + 0.2;
          p.x += Math.sin(time + p.pulseOffset) * 0.3;
          if (p.y < 0) p.y = height;
        } else {
          // Twilight & Deep Ocean: marine snow drifts slowly downward
          p.y += Math.abs(p.speedY) * 0.5 + 0.15;
          p.x += Math.cos(time * 0.5 + p.pulseOffset) * 0.2;
          if (p.y > height) p.y = 0;
        }

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentOpacity =
          p.opacity * (0.6 + 0.4 * Math.sin(time * p.pulseSpeed * 60 + p.pulseOffset));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        if (depth <= 200) {
          // Sunlit bubbles / plankton
          ctx.fillStyle = `rgba(53, 194, 200, ${currentOpacity * 0.7})`;
        } else if (depth <= 1000) {
          // Twilight: Soft marine snow and violet-cyan photophore specks
          const isBio = p.type === 'bioluminescent';
          ctx.fillStyle = isBio
            ? `rgba(165, 243, 252, ${currentOpacity * 0.85})`
            : `rgba(234, 248, 252, ${currentOpacity * 0.4})`;
        } else {
          // Deep & Abyss: Bioluminescent starlight specks
          const isBio = p.type === 'bioluminescent';
          ctx.fillStyle = isBio
            ? `rgba(56, 189, 248, ${currentOpacity * 0.9})`
            : `rgba(124, 58, 237, ${currentOpacity * 0.5})`;
        }
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [depth]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-1000 ease-out select-none"
      style={{
        background: getGradientStyle(),
      }}
      aria-hidden="true"
    >
      {/* Particle Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80" />

      {/* Surface Sunlight & Caustic Light Layer (Zones 1 & 2 only) */}
      {(zone === 'surface' || zone === 'shallow') && (
        <div
          className="absolute inset-0 pointer-events-none z-1 transition-opacity duration-1000"
          style={{
            opacity: zone === 'surface' ? 0.45 : 0.2,
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(53, 194, 200, 0.25) 0%, rgba(8, 126, 164, 0.1) 50%, transparent 80%)',
          }}
        >
          {/* Subtle god rays / caustics effect */}
          <div className="ocean-god-rays absolute inset-0 opacity-40 mix-blend-screen" />
        </div>
      )}

      {/* Deep Sea Ambient Bioluminescence Dust (Zones 3, 4 & 5) */}
      {(zone === 'twilight' || zone === 'deep' || zone === 'abyss') && (
        <div
          className="absolute inset-0 pointer-events-none z-1 transition-opacity duration-1000"
          style={{
            opacity: zone === 'abyss' ? 0.35 : 0.25,
            background:
              'radial-gradient(circle at 80% 40%, rgba(124, 58, 237, 0.12) 0%, transparent 60%), radial-gradient(circle at 20% 70%, rgba(53, 194, 200, 0.08) 0%, transparent 60%)',
          }}
        />
      )}

      {/* ==========================================
          VINTAGE MARINE LIFE ENCOUNTERS (Depth-Gated)
          ========================================== */}

      {/* ZONE 1: Sea Turtle Swimming (Surface 0-50m) */}
      {zone === 'surface' && (
        <div
          className="absolute top-24 right-4 sm:right-16 z-2 transition-all duration-1000 animate-sea-drift"
          style={{
            transform: `translateY(${zoneProgress * 40}px)`,
            opacity: Math.max(0.2, 0.85 - zoneProgress * 0.4),
          }}
        >
          <SeaTurtleIllustration />
        </div>
      )}

      {/* ZONE 2: Manta Ray Gliding (Shallow 50-200m) */}
      {zone === 'shallow' && (
        <div
          className="absolute top-36 left-4 sm:left-12 z-2 transition-all duration-1000 animate-manta-glide"
          style={{
            transform: `translateY(${zoneProgress * 50}px) scale(0.95)`,
            opacity: 0.8,
          }}
        >
          <MantaRayIllustration />
        </div>
      )}

      {/* ZONE 3: Lanternfish & Comb Jelly (Twilight 200-1000m) */}
      {zone === 'twilight' && (
        <>
          <div
            className="absolute top-28 right-8 sm:right-24 z-2 transition-all duration-1000 animate-fish-drift"
            style={{
              transform: `translateY(${zoneProgress * 40}px)`,
              opacity: 0.85,
            }}
          >
            <LanternfishIllustration />
          </div>
          <div
            className="absolute bottom-24 left-8 sm:left-20 z-2 transition-all duration-1000 animate-jelly-pulse"
            style={{
              transform: `translateY(${-zoneProgress * 30}px)`,
              opacity: 0.75,
            }}
          >
            <CombJellyIllustration />
          </div>
        </>
      )}

      {/* ZONE 4: Giant Squid & Anglerfish (Deep Ocean 1000-4000m) */}
      {zone === 'deep' && (
        <>
          <div
            className="absolute top-16 left-0 -ml-12 sm:ml-4 z-2 transition-all duration-1000 animate-squid-drift"
            style={{
              transform: `translateY(${zoneProgress * 60}px)`,
              opacity: 0.75,
            }}
          >
            <GiantSquidIllustration />
          </div>
          <div
            className="absolute bottom-20 right-6 sm:right-20 z-2 transition-all duration-1000 animate-angler-bob"
            style={{
              transform: `translateY(${-zoneProgress * 35}px)`,
              opacity: 0.85,
            }}
          >
            <AnglerfishIllustration />
          </div>
        </>
      )}

      {/* ZONE 5: Hadal Snailfish (Abyss 4000-11000m) */}
      {zone === 'abyss' && (
        <div
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-2 transition-all duration-1000 animate-snailfish-glide"
          style={{
            transform: `translateX(-50%) translateY(${zoneProgress * 30}px)`,
            opacity: 0.85,
          }}
        >
          <HadalSnailfishIllustration />
        </div>
      )}

      {/* Editorial Watermark Coordinates */}
      <div className="absolute bottom-4 right-4 z-2 text-[10px] font-mono tracking-widest text-[#19A7C7]/30 uppercase select-none hidden md:block">
        EXPEDITION BIỂN PHIM · {depth}M · LAT 16°04'N 108°13'E
      </div>
    </div>
  );
};
