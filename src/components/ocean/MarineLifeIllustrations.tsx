import React from 'react';

// ============================================================================
// ZONE 1: SURFACE (0 - 50m) · MẶT NƯỚC
// ============================================================================

/** Cá heo (Dolphin) */
export const DolphinIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/dolphin.png"
    alt="Cá heo (Dolphin)"
    className={`w-44 sm:w-56 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-lg select-none pointer-events-none ${className}`}
  />
);

/** Rùa biển (Sea Turtle) */
export const SeaTurtleIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/sea-turtle.png"
    alt="Rùa biển (Sea Turtle)"
    className={`w-36 sm:w-48 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  />
);

/** Đàn cá nhỏ (Fish School) */
export const FishSchoolIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/fish-school.png"
    alt="Đàn cá nhỏ (Fish School)"
    className={`w-32 sm:w-44 h-auto opacity-75 hover:opacity-95 transition-opacity filter drop-shadow-sm select-none pointer-events-none ${className}`}
  />
);

/** Hải âu (Seagulls) */
export const SeagullsIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/seagulls.png"
    alt="Hải âu (Seagulls)"
    className={`w-36 sm:w-48 h-auto opacity-85 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  />
);

/** Sóng biển / Mặt nước (Surface Waves) */
export const SurfaceWavesIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/surface-waves.png"
    alt="Sóng biển (Surface Waves)"
    className={`w-40 sm:w-56 h-auto opacity-75 hover:opacity-95 transition-opacity select-none pointer-events-none ${className}`}
  />
);

// ============================================================================
// ZONE 2: SHALLOW (50 - 200m) · VÙNG SÁNG
// ============================================================================

/** Cá đuối manta (Manta Ray) */
export const MantaRayIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/manta-ray.png"
    alt="Cá đuối manta (Manta Ray)"
    className={`w-52 sm:w-72 h-auto opacity-75 hover:opacity-95 transition-opacity filter drop-shadow-lg select-none pointer-events-none ${className}`}
  />
);

/** Sứa biển vùng sáng (Shallow Jellyfish) */
export const JellyfishShallowIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/jellyfish-shallow.png"
    alt="Sứa biển (Shallow Jellyfish)"
    className={`w-36 sm:w-48 h-auto opacity-80 hover:opacity-100 transition-opacity select-none pointer-events-none ${className}`}
  />
);

/** Cá rạn san hô (Coral Reef Fish - Nemo, Dory, Tang) */
export const CoralFishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/coral-fish.png"
    alt="Cá rạn san hô (Coral Reef Fish)"
    className={`w-36 sm:w-48 h-auto opacity-85 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  />
);

/** Cá ngựa đôi (Seahorses) */
export const SeahorsesIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/seahorses.png"
    alt="Cá ngựa (Seahorses)"
    className={`w-24 sm:w-32 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  />
);

/** Rạn san hô (Coral Reef) */
export const CoralReefIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/coral-reef.png"
    alt="Rạn san hô (Coral Reef)"
    className={`w-44 sm:w-60 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-lg select-none pointer-events-none ${className}`}
  />
);

// ============================================================================
// ZONE 3: TWILIGHT (200 - 1000m) · VÙNG CHẬP TỐI
// ============================================================================

/** Sứa phát quang (Bioluminescent Jellyfish) */
export const BioluminescentJellyIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/bioluminescent-jelly.png"
    alt="Sứa phát quang (Bioluminescent Jellyfish)"
    className={`w-36 sm:w-48 h-auto opacity-85 hover:opacity-100 transition-opacity select-none pointer-events-none filter drop-shadow-[0_0_12px_rgba(56,189,248,0.4)] ${className}`}
  />
);

/** Cá đèn lồng (Lanternfish School) */
export const LanternfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/lanternfish.png"
    alt="Cá đèn lồng (Lanternfish)"
    className={`w-36 sm:w-48 h-auto opacity-85 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  />
);

/** Mực đèn lồng (Lantern Squid) */
export const LanternSquidIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/lantern-squid.png"
    alt="Mực đèn lồng (Lantern Squid)"
    className={`w-40 sm:w-56 h-auto opacity-80 hover:opacity-100 transition-opacity select-none pointer-events-none filter drop-shadow-[0_0_10px_rgba(244,63,94,0.3)] ${className}`}
  />
);

/** Sứa lược (Comb Jelly / Ctenophore) */
export const CombJellyIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/comb-jelly.png"
    alt="Sứa lược (Comb Jelly)"
    className={`w-28 sm:w-36 h-auto opacity-80 hover:opacity-95 transition-opacity select-none pointer-events-none filter drop-shadow-[0_0_10px_rgba(168,85,247,0.35)] ${className}`}
  />
);

/** Cá rồng biển sâu (Dragonfish) */
export const DragonfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/dragonfish.png"
    alt="Cá rồng (Dragonfish)"
    className={`w-40 sm:w-56 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-md select-none pointer-events-none ${className}`}
  />
);

// ============================================================================
// ZONE 4: DEEP OCEAN (1000 - 4000m) · VÙNG SÂU
// ============================================================================

/** Cá nhà táng (Sperm Whale) */
export const SpermWhaleIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/sperm-whale.png"
    alt="Cá nhà táng (Sperm Whale)"
    className={`w-56 sm:w-80 h-auto opacity-70 hover:opacity-90 transition-opacity filter drop-shadow-2xl select-none pointer-events-none ${className}`}
  />
);

/** Cá cần câu (Anglerfish with Glowing Esca) */
export const AnglerfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/anglerfish.png"
    alt="Cá cần câu (Anglerfish)"
    className={`w-40 sm:w-56 h-auto opacity-85 hover:opacity-100 transition-opacity filter drop-shadow-[0_0_14px_rgba(56,189,248,0.45)] select-none pointer-events-none ${className}`}
  />
);

/** Cá gulper (Gulper Eel / Pelican Eel) */
export const GulperEelIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/gulper-eel.png"
    alt="Cá gulper (Gulper Eel)"
    className={`w-44 sm:w-64 h-auto opacity-75 hover:opacity-95 transition-opacity filter drop-shadow-lg select-none pointer-events-none ${className}`}
  />
);

/** Mực khổng lồ (Giant Squid) */
export const GiantSquidIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/giant-squid.png"
    alt="Mực khổng lồ (Giant Squid)"
    className={`w-56 sm:w-80 h-auto opacity-75 hover:opacity-95 transition-opacity filter drop-shadow-2xl select-none pointer-events-none ${className}`}
  />
);

/** Cá rắn (Viperfish) */
export const ViperfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/viperfish.png"
    alt="Cá rắn (Viperfish)"
    className={`w-40 sm:w-56 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-lg select-none pointer-events-none ${className}`}
  />
);

// ============================================================================
// ZONE 5: ABYSS / HADAL (4000 - 11000m) · VỰC THẲM
// ============================================================================

/** Sứa đáy biển (Deep Sea Jellyfish) */
export const DeepSeaJellyfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/deep-sea-jellyfish.png"
    alt="Sứa đáy biển (Deep Sea Jellyfish)"
    className={`w-36 sm:w-48 h-auto opacity-75 hover:opacity-95 transition-opacity select-none pointer-events-none filter drop-shadow-[0_0_12px_rgba(129,140,248,0.35)] ${className}`}
  />
);

/** Sứa mũ (Atolla Jellyfish) */
export const AtollaJellyfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/atolla-jellyfish.png"
    alt="Sứa mũ (Atolla Jellyfish)"
    className={`w-36 sm:w-48 h-auto opacity-80 hover:opacity-100 transition-opacity select-none pointer-events-none filter drop-shadow-[0_0_14px_rgba(244,63,94,0.4)] ${className}`}
  />
);

/** Cá ốc sên (Hadal Snailfish) */
export const HadalSnailfishIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/hadal-snailfish.png"
    alt="Cá ốc sên (Hadal Snailfish)"
    className={`w-40 sm:w-56 h-auto opacity-80 hover:opacity-100 transition-opacity select-none pointer-events-none filter drop-shadow-[0_0_8px_rgba(224,242,254,0.25)] ${className}`}
  />
);

/** Tôm chân đều khổng lồ (Giant Isopod) */
export const GiantIsopodIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/giant-isopod.png"
    alt="Tôm chân đều khổng lồ (Giant Isopod)"
    className={`w-36 sm:w-52 h-auto opacity-80 hover:opacity-100 transition-opacity filter drop-shadow-xl select-none pointer-events-none ${className}`}
  />
);

/** Sinh vật giun ống (Tube Worm / Ascidian) */
export const TubeWormIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/images/sea-creatures/tube-worm.png"
    alt="Sinh vật giun ống (Tube Worm)"
    className={`w-36 sm:w-48 h-auto opacity-80 hover:opacity-100 transition-opacity select-none pointer-events-none filter drop-shadow-[0_0_12px_rgba(56,189,248,0.4)] ${className}`}
  />
);

// ============================================================================
// METADATA REGISTRY: ALL 25 SPECIES ORGANIZED BY DEPTH ZONE
// ============================================================================

export interface MarineCreatureMeta {
  id: string;
  nameVi: string;
  nameEn: string;
  zone: 'surface' | 'shallow' | 'twilight' | 'deep' | 'abyss';
  zoneNameVi: string;
  depthRange: string;
  image: string;
}

export const ALL_MARINE_CREATURES: MarineCreatureMeta[] = [
  // Surface (0 - 50m)
  { id: 'dolphin', nameVi: 'Cá heo', nameEn: 'Dolphin', zone: 'surface', zoneNameVi: 'Mặt nước', depthRange: '0 - 50m', image: '/images/sea-creatures/dolphin.png' },
  { id: 'sea-turtle', nameVi: 'Rùa biển', nameEn: 'Sea Turtle', zone: 'surface', zoneNameVi: 'Mặt nước', depthRange: '0 - 50m', image: '/images/sea-creatures/sea-turtle.png' },
  { id: 'fish-school', nameVi: 'Đàn cá nhỏ', nameEn: 'School of Fish', zone: 'surface', zoneNameVi: 'Mặt nước', depthRange: '0 - 50m', image: '/images/sea-creatures/fish-school.png' },
  { id: 'seagulls', nameVi: 'Hải âu', nameEn: 'Seagulls', zone: 'surface', zoneNameVi: 'Mặt nước', depthRange: '0 - 50m', image: '/images/sea-creatures/seagulls.png' },
  { id: 'surface-waves', nameVi: 'Sóng biển', nameEn: 'Surface Waves', zone: 'surface', zoneNameVi: 'Mặt nước', depthRange: '0 - 50m', image: '/images/sea-creatures/surface-waves.png' },

  // Shallow (50 - 200m)
  { id: 'manta-ray', nameVi: 'Cá đuối manta', nameEn: 'Manta Ray', zone: 'shallow', zoneNameVi: 'Vùng sáng', depthRange: '50 - 200m', image: '/images/sea-creatures/manta-ray.png' },
  { id: 'jellyfish-shallow', nameVi: 'Sứa biển', nameEn: 'Shallow Jellyfish', zone: 'shallow', zoneNameVi: 'Vùng sáng', depthRange: '50 - 200m', image: '/images/sea-creatures/jellyfish-shallow.png' },
  { id: 'coral-fish', nameVi: 'Cá rạn san hô', nameEn: 'Coral Reef Fish', zone: 'shallow', zoneNameVi: 'Vùng sáng', depthRange: '50 - 200m', image: '/images/sea-creatures/coral-fish.png' },
  { id: 'seahorses', nameVi: 'Cá ngựa', nameEn: 'Seahorses', zone: 'shallow', zoneNameVi: 'Vùng sáng', depthRange: '50 - 200m', image: '/images/sea-creatures/seahorses.png' },
  { id: 'coral-reef', nameVi: 'Rạn san hô', nameEn: 'Coral Reef', zone: 'shallow', zoneNameVi: 'Vùng sáng', depthRange: '50 - 200m', image: '/images/sea-creatures/coral-reef.png' },

  // Twilight (200 - 1000m)
  { id: 'bioluminescent-jelly', nameVi: 'Sứa phát quang', nameEn: 'Bioluminescent Jellyfish', zone: 'twilight', zoneNameVi: 'Vùng chập tối', depthRange: '200 - 1000m', image: '/images/sea-creatures/bioluminescent-jelly.png' },
  { id: 'lanternfish', nameVi: 'Cá đèn lồng', nameEn: 'Lanternfish', zone: 'twilight', zoneNameVi: 'Vùng chập tối', depthRange: '200 - 1000m', image: '/images/sea-creatures/lanternfish.png' },
  { id: 'lantern-squid', nameVi: 'Mực đèn lồng', nameEn: 'Lantern Squid', zone: 'twilight', zoneNameVi: 'Vùng chập tối', depthRange: '200 - 1000m', image: '/images/sea-creatures/lantern-squid.png' },
  { id: 'comb-jelly', nameVi: 'Sứa lược', nameEn: 'Comb Jelly', zone: 'twilight', zoneNameVi: 'Vùng chập tối', depthRange: '200 - 1000m', image: '/images/sea-creatures/comb-jelly.png' },
  { id: 'dragonfish', nameVi: 'Cá rồng', nameEn: 'Dragonfish', zone: 'twilight', zoneNameVi: 'Vùng chập tối', depthRange: '200 - 1000m', image: '/images/sea-creatures/dragonfish.png' },

  // Deep Ocean (1000 - 4000m)
  { id: 'sperm-whale', nameVi: 'Cá nhà táng', nameEn: 'Sperm Whale', zone: 'deep', zoneNameVi: 'Vùng sâu', depthRange: '1000 - 4000m', image: '/images/sea-creatures/sperm-whale.png' },
  { id: 'anglerfish', nameVi: 'Cá cần câu', nameEn: 'Anglerfish', zone: 'deep', zoneNameVi: 'Vùng sâu', depthRange: '1000 - 4000m', image: '/images/sea-creatures/anglerfish.png' },
  { id: 'gulper-eel', nameVi: 'Cá gulper', nameEn: 'Gulper Eel', zone: 'deep', zoneNameVi: 'Vùng sâu', depthRange: '1000 - 4000m', image: '/images/sea-creatures/gulper-eel.png' },
  { id: 'giant-squid', nameVi: 'Mực khổng lồ', nameEn: 'Giant Squid', zone: 'deep', zoneNameVi: 'Vùng sâu', depthRange: '1000 - 4000m', image: '/images/sea-creatures/giant-squid.png' },
  { id: 'viperfish', nameVi: 'Cá rắn', nameEn: 'Viperfish', zone: 'deep', zoneNameVi: 'Vùng sâu', depthRange: '1000 - 4000m', image: '/images/sea-creatures/viperfish.png' },

  // Abyss / Hadal (4000 - 11000m)
  { id: 'deep-sea-jellyfish', nameVi: 'Sứa đáy biển', nameEn: 'Deep Sea Jellyfish', zone: 'abyss', zoneNameVi: 'Vực thẳm', depthRange: '4000 - 11000m', image: '/images/sea-creatures/deep-sea-jellyfish.png' },
  { id: 'atolla-jellyfish', nameVi: 'Sứa mũ', nameEn: 'Atolla Jellyfish', zone: 'abyss', zoneNameVi: 'Vực thẳm', depthRange: '4000 - 11000m', image: '/images/sea-creatures/atolla-jellyfish.png' },
  { id: 'hadal-snailfish', nameVi: 'Cá ốc sên', nameEn: 'Hadal Snailfish', zone: 'abyss', zoneNameVi: 'Vực thẳm', depthRange: '4000 - 11000m', image: '/images/sea-creatures/hadal-snailfish.png' },
  { id: 'giant-isopod', nameVi: 'Tôm chân đều khổng lồ', nameEn: 'Giant Isopod', zone: 'abyss', zoneNameVi: 'Vực thẳm', depthRange: '4000 - 11000m', image: '/images/sea-creatures/giant-isopod.png' },
  { id: 'tube-worm', nameVi: 'Sinh vật giun ống', nameEn: 'Tube Worm', zone: 'abyss', zoneNameVi: 'Vực thẳm', depthRange: '4000 - 11000m', image: '/images/sea-creatures/tube-worm.png' },
];
