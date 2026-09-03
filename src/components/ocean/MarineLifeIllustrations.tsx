import React from 'react';
import { useOceanDepth } from '../../context/OceanDepthContext.js';

// ==========================================
// 1. VINTAGE ENGRAVED SEA TURTLE (Surface/Shallow)
// ==========================================
export const SeaTurtleIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 160 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-36 sm:w-48 h-auto opacity-75 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  >
    {/* Shell (Carapace) with engraved hatching */}
    <ellipse cx="80" cy="70" rx="38" ry="46" fill="#0C344E" stroke="#35C2C8" strokeWidth="1.5" />
    <path
      d="M80 30 C 60 50, 60 90, 80 110 M80 30 C 100 50, 100 90, 80 110 M50 50 C 70 60, 90 60, 110 50 M44 70 C 65 75, 95 75, 116 70 M50 90 C 70 80, 90 80, 110 90"
      stroke="#19A7C7"
      strokeWidth="1"
      strokeDasharray="2 1.5"
      opacity="0.8"
    />
    {/* Stipple texture inside shell */}
    <circle cx="80" cy="55" r="1.5" fill="#35C2C8" opacity="0.6" />
    <circle cx="72" cy="70" r="1.5" fill="#35C2C8" opacity="0.6" />
    <circle cx="88" cy="70" r="1.5" fill="#35C2C8" opacity="0.6" />
    <circle cx="80" cy="85" r="1.5" fill="#35C2C8" opacity="0.6" />

    {/* Front Flippers */}
    <path
      d="M52 46 C 25 35, 10 55, 18 75 C 28 65, 42 58, 52 56 Z"
      fill="#082A40"
      stroke="#35C2C8"
      strokeWidth="1.2"
    />
    <path
      d="M108 46 C 135 35, 150 55, 142 75 C 132 65, 118 58, 108 56 Z"
      fill="#082A40"
      stroke="#35C2C8"
      strokeWidth="1.2"
    />

    {/* Rear Flippers */}
    <path
      d="M60 106 C 45 120, 52 132, 64 126 C 68 118, 66 110, 60 106 Z"
      fill="#082A40"
      stroke="#19A7C7"
      strokeWidth="1"
    />
    <path
      d="M100 106 C 115 120, 108 132, 96 126 C 92 118, 94 110, 100 106 Z"
      fill="#082A40"
      stroke="#19A7C7"
      strokeWidth="1"
    />

    {/* Head & Neck */}
    <path
      d="M74 28 C 74 15, 86 15, 86 28 Z"
      fill="#082A40"
      stroke="#35C2C8"
      strokeWidth="1.2"
    />
    {/* Eyes */}
    <circle cx="76" cy="20" r="1" fill="#EAF8FC" />
    <circle cx="84" cy="20" r="1" fill="#EAF8FC" />
  </svg>
);

// ==========================================
// 2. VINTAGE MANTA RAY (Shallow/Twilight)
// ==========================================
export const MantaRayIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 220 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-52 sm:w-72 h-auto opacity-70 hover:opacity-90 transition-opacity filter drop-shadow-lg select-none pointer-events-none ${className}`}
  >
    {/* Body & Wings with naturalist contour lines */}
    <path
      d="M110 35 C 150 45, 205 75, 215 105 C 185 105, 145 115, 120 135 C 115 140, 105 140, 100 135 C 75 115, 35 105, 5 105 C 15 75, 70 45, 110 35 Z"
      fill="url(#mantaGradient)"
      stroke="#19A7C7"
      strokeWidth="1.5"
    />
    {/* Cephalic Horns */}
    <path d="M100 36 C 96 20, 104 18, 106 33" stroke="#35C2C8" strokeWidth="1.5" fill="none" />
    <path d="M120 36 C 124 20, 116 18, 114 33" stroke="#35C2C8" strokeWidth="1.5" fill="none" />

    {/* Long Tail */}
    <path
      d="M110 138 C 111 160, 114 175, 115 178"
      stroke="#35C2C8"
      strokeWidth="1.2"
      strokeLinecap="round"
    />

    {/* Engraving Wing Ribs */}
    <path
      d="M110 50 C 135 65, 170 85, 195 98 M110 65 C 130 80, 160 95, 180 102 M110 80 C 125 90, 145 105, 160 115 M110 50 C 85 65, 50 85, 25 98 M110 65 C 90 80, 60 95, 40 102 M110 80 C 95 90, 75 105, 60 115"
      stroke="#19A7C7"
      strokeWidth="0.8"
      strokeDasharray="3 2"
      opacity="0.6"
    />

    {/* Stipple Spine */}
    <circle cx="110" cy="70" r="1.5" fill="#EAF8FC" opacity="0.8" />
    <circle cx="110" cy="85" r="1.5" fill="#EAF8FC" opacity="0.8" />
    <circle cx="110" cy="100" r="1.5" fill="#EAF8FC" opacity="0.8" />
    <circle cx="110" cy="115" r="1.5" fill="#EAF8FC" opacity="0.8" />

    <defs>
      <linearGradient id="mantaGradient" x1="110" y1="20" x2="110" y2="150" gradientUnits="userSpaceOnUse">
        <stop stopColor="#082A40" stopOpacity="0.9" />
        <stop offset="1" stopColor="#041624" stopOpacity="0.95" />
      </linearGradient>
    </defs>
  </svg>
);

// ==========================================
// 3. BIOLUMINESCENT LANTERNFISH (Twilight Zone)
// ==========================================
export const LanternfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 180 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-36 sm:w-48 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  >
    {/* Body */}
    <path
      d="M30 45 C 50 20, 110 20, 140 40 L 165 25 L 160 45 L 165 65 L 140 50 C 110 70, 50 70, 30 45 Z"
      fill="#061B2B"
      stroke="#087EA4"
      strokeWidth="1.2"
    />
    {/* Large Deep-Sea Eye */}
    <circle cx="50" cy="40" r="10" stroke="#19A7C7" strokeWidth="1" fill="#040F18" />
    <circle cx="50" cy="40" r="5" fill="#35C2C8" className="animate-pulse" />
    <circle cx="52" cy="38" r="1.5" fill="#FFFFFF" />

    {/* Fin linework */}
    <path d="M90 28 C 100 15, 115 15, 120 28" stroke="#087EA4" strokeWidth="1" fill="none" />
    <path d="M85 62 C 95 75, 105 75, 110 62" stroke="#087EA4" strokeWidth="1" fill="none" />

    {/* Photophores (Bioluminescent Pearls along the belly) */}
    <g className="animate-pulse">
      {[55, 68, 81, 94, 107, 120, 133].map((cx, i) => (
        <React.Fragment key={i}>
          <circle cx={cx} cy="58" r="3" fill="#35C2C8" opacity="0.3" />
          <circle cx={cx} cy="58" r="1.5" fill="#A5F3FC" />
        </React.Fragment>
      ))}
    </g>

    {/* Lateral line & Engraving scales */}
    <path d="M60 45 Q 100 44 140 45" stroke="#19A7C7" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.7" />
  </svg>
);

// ==========================================
// 4. TRANSLUCENT COMB JELLY / MEDUSA (Twilight/Deep)
// ==========================================
export const CombJellyIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-28 sm:w-36 h-auto opacity-75 hover:opacity-95 transition-opacity select-none pointer-events-none ${className}`}
  >
    {/* Bell with iridescent gradient */}
    <path
      d="M20 70 C 20 25, 100 25, 100 70 C 100 85, 80 95, 60 95 C 40 95, 20 85, 20 70 Z"
      fill="url(#jellyGlow)"
      stroke="#35C2C8"
      strokeWidth="1.2"
      opacity="0.85"
    />
    {/* Inner organs & Ctenophore ribs (Glowing combs) */}
    <path d="M40 70 C 40 40, 55 35, 60 35 C 65 35, 80 40, 80 70" stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />
    <path d="M50 75 C 50 45, 60 40, 60 40 C 60 40, 70 45, 70 75" stroke="#35C2C8" strokeWidth="1" strokeDasharray="2 2" />

    {/* Long ethereal trailing tentacles */}
    <path d="M35 95 C 30 130, 45 160, 38 195" stroke="#19A7C7" strokeWidth="0.9" strokeDasharray="2 3" opacity="0.7" />
    <path d="M50 95 C 55 125, 48 165, 54 198" stroke="#35C2C8" strokeWidth="1" opacity="0.8" />
    <path d="M60 95 C 60 135, 65 170, 60 200" stroke="#7C3AED" strokeWidth="1.2" opacity="0.9" />
    <path d="M70 95 C 65 125, 72 165, 66 198" stroke="#35C2C8" strokeWidth="1" opacity="0.8" />
    <path d="M85 95 C 90 130, 75 160, 82 195" stroke="#19A7C7" strokeWidth="0.9" strokeDasharray="2 3" opacity="0.7" />

    <defs>
      <radialGradient id="jellyGlow" cx="60" cy="60" r="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#35C2C8" stopOpacity="0.4" />
        <stop offset="0.7" stopColor="#7C3AED" stopOpacity="0.25" />
        <stop offset="1" stopColor="#062B45" stopOpacity="0.1" />
      </radialGradient>
    </defs>
  </svg>
);

// ==========================================
// 5. DEEP OCEAN GIANT SQUID (Deep Ocean 1000m-4000m)
// ==========================================
export const GiantSquidIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 260 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-56 sm:w-80 h-auto opacity-70 hover:opacity-90 transition-opacity filter drop-shadow-2xl select-none pointer-events-none ${className}`}
  >
    {/* Torpedo Mantle */}
    <path
      d="M130 20 C 105 50, 95 100, 105 150 C 115 160, 145 160, 155 150 C 165 100, 155 50, 130 20 Z"
      fill="url(#squidGradient)"
      stroke="#7C3AED"
      strokeWidth="1.5"
    />
    {/* Fins */}
    <path d="M130 20 C 100 25, 80 45, 105 60 Z" fill="#0A1628" stroke="#7C3AED" strokeWidth="1" />
    <path d="M130 20 C 160 25, 180 45, 155 60 Z" fill="#0A1628" stroke="#7C3AED" strokeWidth="1" />

    {/* Giant Cold Deep-Sea Eye */}
    <circle cx="118" cy="148" r="8" fill="#030A12" stroke="#35C2C8" strokeWidth="1" />
    <circle cx="118" cy="148" r="4" fill="#EAF8FC" className="animate-pulse" />

    {/* 8 Arms + 2 Feeding Tentacles */}
    <path d="M110 155 C 95 180, 80 220, 75 260 C 72 280, 85 300, 80 320" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M120 155 C 110 190, 100 230, 95 270 C 92 290, 100 310, 95 320" stroke="#8B5CF6" strokeWidth="1.5" />
    <path d="M128 156 C 125 195, 120 235, 118 280" stroke="#35C2C8" strokeWidth="1.2" strokeDasharray="3 2" />
    <path d="M135 156 C 135 195, 140 235, 142 280" stroke="#35C2C8" strokeWidth="1.2" strokeDasharray="3 2" />
    <path d="M140 155 C 150 190, 160 230, 165 270 C 168 290, 160 310, 165 320" stroke="#8B5CF6" strokeWidth="1.5" />
    <path d="M150 155 C 165 180, 180 220, 185 260 C 188 280, 175 300, 180 320" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />

    {/* Long Feeder Tentacles */}
    <path d="M115 156 C 85 210, 60 260, 50 315" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" />
    <path d="M145 156 C 175 210, 200 260, 210 315" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" />

    {/* Club ends */}
    <ellipse cx="48" cy="315" rx="5" ry="8" fill="#7C3AED" stroke="#C084FC" strokeWidth="1" />
    <ellipse cx="212" cy="315" rx="5" ry="8" fill="#7C3AED" stroke="#C084FC" strokeWidth="1" />

    <defs>
      <linearGradient id="squidGradient" x1="130" y1="20" x2="130" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E1035" />
        <stop offset="1" stopColor="#0B132B" />
      </linearGradient>
    </defs>
  </svg>
);

// ==========================================
// 6. DEEP-SEA ANGLERFISH (Deep Ocean / Hadal)
// ==========================================
export const AnglerfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 180 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-40 sm:w-52 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-xl select-none pointer-events-none ${className}`}
  >
    {/* Body */}
    <path
      d="M50 70 C 50 35, 110 35, 130 65 L 155 50 L 150 70 L 155 90 L 130 75 C 110 105, 50 105, 50 70 Z"
      fill="#03080F"
      stroke="#19A7C7"
      strokeWidth="1.5"
    />

    {/* Gaping Mouth with Needle Teeth */}
    <path d="M50 70 L 95 72" stroke="#041424" strokeWidth="2" />
    <g stroke="#EAF8FC" strokeWidth="1.2">
      <line x1="56" y1="62" x2="59" y2="72" />
      <line x1="66" y1="60" x2="68" y2="72" />
      <line x1="76" y1="61" x2="77" y2="72" />
      <line x1="86" y1="63" x2="86" y2="72" />
      <line x1="60" y1="80" x2="62" y2="72" />
      <line x1="70" y1="82" x2="71" y2="72" />
      <line x1="80" y1="81" x2="80" y2="72" />
      <line x1="90" y1="79" x2="89" y2="72" />
    </g>

    {/* Tiny Dead-Ocean Eye */}
    <circle cx="68" cy="52" r="3" fill="#082A40" stroke="#35C2C8" strokeWidth="0.8" />
    <circle cx="68" cy="52" r="1" fill="#FFFFFF" />

    {/* Illiceum (The Rod & Glowing Esca / Lure) */}
    <path
      d="M75 40 C 75 15, 35 15, 30 35"
      stroke="#35C2C8"
      strokeWidth="1.5"
      fill="none"
    />
    {/* Glowing Lure */}
    <circle cx="30" cy="35" r="8" fill="#35C2C8" opacity="0.3" className="animate-ping" />
    <circle cx="30" cy="35" r="5" fill="#35C2C8" opacity="0.7" />
    <circle cx="30" cy="35" r="2.5" fill="#FFFFFF" />
  </svg>
);

// ==========================================
// 7. HADAL SNAILFISH (Abyss / Hadal 4000m-11000m)
// ==========================================
export const HadalSnailfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 190 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-40 sm:w-56 h-auto opacity-75 hover:opacity-95 transition-opacity select-none pointer-events-none ${className}`}
  >
    {/* Translucent gelatinous tadpole body */}
    <path
      d="M35 45 C 35 25, 75 25, 100 38 C 125 45, 155 42, 175 45 C 155 48, 125 45, 100 52 C 75 65, 35 65, 35 45 Z"
      fill="url(#snailfishGradient)"
      stroke="#06B6D4"
      strokeWidth="1"
      opacity="0.85"
    />
    {/* Delicate continuous fin ribbon */}
    <path
      d="M75 30 Q 125 36 175 45 Q 125 54 75 60"
      stroke="#35C2C8"
      strokeWidth="0.8"
      strokeDasharray="2 2"
      opacity="0.6"
    />

    {/* Translucent internal spine visible through skin */}
    <path d="M45 45 L 165 45" stroke="#A5F3FC" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

    {/* Gentle reduced deep eye */}
    <circle cx="50" cy="40" r="3" fill="#040F18" stroke="#06B6D4" strokeWidth="0.8" />
    <circle cx="50" cy="40" r="1" fill="#FFFFFF" opacity="0.7" />

    <defs>
      <linearGradient id="snailfishGradient" x1="35" y1="45" x2="175" y2="45" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0B1E2E" stopOpacity="0.7" />
        <stop offset="0.5" stopColor="#082F49" stopOpacity="0.5" />
        <stop offset="1" stopColor="#02060C" stopOpacity="0.2" />
      </linearGradient>
    </defs>
  </svg>
);
