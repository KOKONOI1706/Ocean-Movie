import React from 'react';
import { useOceanDepth } from '../../context/OceanDepthContext.js';

interface DepthMarker {
  depth: number;
  label: string;
  sublabel: string;
  normalizedPos: number; // 0.0 to 1.0 along the line
}

const DEPTH_MARKERS: DepthMarker[] = [
  { depth: 0,     label: '0m',      sublabel: 'MẶT NƯỚC',     normalizedPos: 0.00 },
  { depth: 200,   label: '200m',    sublabel: 'VÙNG SÁNG',    normalizedPos: 0.20 },
  { depth: 1000,  label: '1000m',   sublabel: 'VÙNG CHẠP TỐI', normalizedPos: 0.42 },
  { depth: 4000,  label: '4000m',   sublabel: 'VÙNG SÂU',     normalizedPos: 0.65 },
  { depth: 7000,  label: '7000m',   sublabel: 'VỰC THẲM',     normalizedPos: 0.82 },
  { depth: 11000, label: '11000m',  sublabel: 'RÃNH HADAL',   normalizedPos: 1.00 },
];

export const VerticalDepthIndicator: React.FC = () => {
  const { depth, progress, scrollToDepth } = useOceanDepth();

  // Find nearest marker index
  let activeIndex = 0;
  for (let i = 0; i < DEPTH_MARKERS.length; i++) {
    if (depth >= DEPTH_MARKERS[i].depth) {
      activeIndex = i;
    }
  }

  // Smooth position for the traveling glowing pip
  const pipPercentage = Math.min(100, Math.max(0, progress * 100));

  return (
    <nav
      aria-label="Thước đo độ sâu đại dương"
      className="fixed left-4 xl:left-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-start select-none pointer-events-auto"
    >
      <div className="relative flex flex-col justify-between h-[420px] py-1">
        {/* Continuous Vertical Axis Line */}
        <div className="absolute left-[3px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-400/40 via-cyan-600/20 to-cyan-900/10" />

        {/* Traveling Active Pip */}
        <div
          className="absolute left-[3px] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none"
          style={{ top: `${pipPercentage}%` }}
        >
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#35C2C8] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35C2C8] ring-2 ring-[#030A14] shadow-[0_0_8px_#35C2C8]" />
          </div>
        </div>

        {/* Markers along the vertical axis */}
        {DEPTH_MARKERS.map((marker, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={marker.depth}
              onClick={() => scrollToDepth(marker.depth)}
              className="group flex items-start gap-2.5 text-left cursor-pointer transition-all duration-200 focus:outline-none"
              title={`Lặn đến ${marker.depth}m (${marker.sublabel})`}
            >
              {/* Tick Mark on Line */}
              <div className="relative flex items-center justify-center w-[7px] h-3 shrink-0">
                <span
                  className={`w-2 h-[1px] transition-all duration-300 ${
                    isActive
                      ? 'w-3 bg-[#35C2C8] shadow-[0_0_6px_#35C2C8]'
                      : 'bg-white/20 group-hover:bg-[#35C2C8]/70 group-hover:w-2.5'
                  }`}
                />
              </div>

              {/* Text Labels */}
              <div className="flex flex-col -mt-0.5">
                <span
                  className={`font-mono text-[11px] tracking-tight leading-none transition-colors ${
                    isActive
                      ? 'text-[#35C2C8] font-bold'
                      : 'text-gray-400/70 group-hover:text-gray-200'
                  }`}
                >
                  {marker.label}
                </span>
                <span
                  className={`text-[9px] font-sans tracking-widest uppercase transition-colors mt-0.5 ${
                    isActive
                      ? 'text-cyan-200/90 font-semibold'
                      : 'text-gray-500/80 group-hover:text-cyan-300/80'
                  }`}
                >
                  {marker.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
