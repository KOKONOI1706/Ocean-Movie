import React, { useState } from 'react';
import { useOceanDepth, OCEAN_ZONES, OceanZoneId } from '../../context/OceanDepthContext.js';
import { Compass, ChevronDown, ChevronUp, Waves, Sparkles, Navigation } from 'lucide-react';

export const DepthHUD: React.FC = () => {
  const { depth, zone, zoneInfo, scrollToZone } = useOceanDepth();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const zoneIds: OceanZoneId[] = ['surface', 'shallow', 'twilight', 'deep', 'abyss'];

  return (
    <aside
      aria-label="Độ sâu hải trình"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 select-none font-sans"
    >
      {/* Minimized Pill */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#061F33]/85 hover:bg-[#082A45] border border-[#19A7C7]/40 hover:border-[#35C2C8] text-[#E8F4F8] shadow-2xl backdrop-blur-md transition-all duration-300 cursor-pointer"
          title="Mở bảng đo độ sâu hải trình"
        >
          {/* Pulsing Depth Beacon */}
          <div className="relative w-2.5 h-2.5 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35C2C8] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35C2C8]" />
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-mono font-bold tracking-tight text-[#35C2C8]">
              {depth.toLocaleString()}m
            </span>
            <span className="text-[11px] font-medium text-gray-300 hidden sm:inline">
              · {zoneInfo.nameVi}
            </span>
          </div>

          <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#35C2C8] transition-colors ml-0.5" />
        </button>
      ) : (
        /* Expanded Bathysphere Gauge Panel */
        <div className="w-72 sm:w-80 rounded-2xl bg-[#061F33]/95 border border-[#19A7C7]/40 text-[#E8F4F8] shadow-2xl backdrop-blur-xl p-4 transition-all duration-300 animate-fade-in text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#19A7C7]/20">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#35C2C8]" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#35C2C8]">
                Độ Sâu Hải Trình
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Thu nhỏ"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Depth Counter & Zone Name */}
          <div className="py-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-baseline gap-1">
                {depth.toLocaleString()}
                <span className="text-sm font-normal text-[#35C2C8]">m</span>
              </div>
              <div className="text-xs font-semibold text-[#E8F4F8] mt-0.5">
                {zoneInfo.nameVi}
              </div>
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                {zoneInfo.scientificName}
              </div>
            </div>

            {/* Ambient Stats */}
            <div className="text-right space-y-1">
              <div className="text-[10px] font-mono text-gray-300 bg-[#041424] px-2 py-0.5 rounded border border-white/5">
                {zoneInfo.temperature}
              </div>
              <div className="text-[10px] font-mono text-gray-300 bg-[#041424] px-2 py-0.5 rounded border border-white/5">
                {zoneInfo.pressure}
              </div>
            </div>
          </div>

          {/* Atmospheric description */}
          <p className="text-[11px] text-gray-300 italic bg-[#082A40]/60 p-2 rounded-xl border border-[#19A7C7]/15 mb-3 leading-relaxed">
            {zoneInfo.lightDescription}
          </p>

          {/* Quick-Dive Navigation Track */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
              <span>Các tầng đại dương</span>
              <span className="text-[9px] text-[#35C2C8] font-mono">Nhấp để lặn</span>
            </div>

            <div className="space-y-1">
              {zoneIds.map((zId) => {
                const z = OCEAN_ZONES[zId];
                const isActive = zId === zone;

                return (
                  <button
                    key={zId}
                    onClick={() => scrollToZone(zId)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#087EA4] text-white font-semibold shadow-md'
                        : 'hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: z.accentColor }}
                      />
                      <span>{z.nameVi}</span>
                    </div>
                    <span className="font-mono text-[10px] opacity-75">
                      {z.depthMin}m – {z.depthMax >= 10000 ? '11k' : `${z.depthMax}`}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
