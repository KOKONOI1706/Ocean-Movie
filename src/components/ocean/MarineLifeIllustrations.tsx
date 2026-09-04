import React from 'react';
// ==========================================
// 1. VINTAGE ENGRAVED SEA TURTLE (Surface/Shallow)
// ==========================================
export const SeaTurtleIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/sea-turtle.png"
    alt="Sea Turtle"
    className={`w-36 sm:w-48 h-auto opacity-75 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  />
);

// ==========================================
// 2. VINTAGE MANTA RAY (Shallow/Twilight)
// ==========================================
export const MantaRayIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/manta-ray.png"
    alt="Manta Ray"
    className={`w-52 sm:w-72 h-auto opacity-70 hover:opacity-90 transition-opacity filter drop-shadow-lg select-none pointer-events-none ${className}`}
  />
);

// ==========================================
// 3. BIOLUMINESCENT LANTERNFISH (Twilight Zone)
// ==========================================
export const LanternfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/lanternfish.png"
    alt="Lanternfish"
    className={`w-36 sm:w-48 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  />
);

// ==========================================
// 4. TRANSLUCENT COMB JELLY / MEDUSA (Twilight/Deep)
// ==========================================
export const CombJellyIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/comb-jelly.png"
    alt="Comb Jelly"
    className={`w-28 sm:w-36 h-auto opacity-75 hover:opacity-95 transition-opacity select-none pointer-events-none ${className}`}
  />
);

// ==========================================
// 5. DEEP OCEAN GIANT SQUID (Deep Ocean 1000m-4000m)
// ==========================================
export const GiantSquidIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/giant-squid.png"
    alt="Giant Squid"
    className={`w-56 sm:w-80 h-auto opacity-70 hover:opacity-90 transition-opacity filter drop-shadow-2xl select-none pointer-events-none ${className}`}
  />
);

// ==========================================
// 6. DEEP-SEA ANGLERFISH (Deep Ocean / Hadal)
// ==========================================
export const AnglerfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/anglerfish.png"
    alt="Anglerfish"
    className={`w-40 sm:w-52 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-xl select-none pointer-events-none ${className}`}
  />
);

// ==========================================
// 7. HADAL SNAILFISH (Abyss / Hadal 4000m-11000m)
// ==========================================
export const HadalSnailfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/hadal-snailfish.png"
    alt="Hadal Snailfish"
    className={`w-40 sm:w-56 h-auto opacity-75 hover:opacity-95 transition-opacity select-none pointer-events-none ${className}`}
  />
);

