import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type OceanZoneId = 'surface' | 'shallow' | 'twilight' | 'deep' | 'abyss';

export interface OceanZoneInfo {
  id: OceanZoneId;
  nameVi: string;
  nameEn: string;
  depthMin: number; // in meters
  depthMax: number; // in meters
  scientificName: string;
  temperature: string;
  pressure: string;
  lightDescription: string;
  accentColor: string;
  bgGradient: string;
}

export const OCEAN_ZONES: Record<OceanZoneId, OceanZoneInfo> = {
  surface: {
    id: 'surface',
    nameVi: 'Tầng Mặt Nước',
    nameEn: 'Surface Zone',
    scientificName: 'Epipelagic Zone',
    depthMin: 0,
    depthMax: 50,
    temperature: '22°C – 26°C',
    pressure: '1 – 5 atm',
    lightDescription: 'Ánh sáng tự nhiên chan hòa, ấm áp',
    accentColor: '#35C2C8',
    bgGradient: 'linear-gradient(180deg, #0A2239 0%, #062B45 100%)',
  },
  shallow: {
    id: 'shallow',
    nameVi: 'Tầng Biển Nắng',
    nameEn: 'Shallow Waters',
    scientificName: 'Mesopelagic Upper',
    depthMin: 50,
    depthMax: 200,
    temperature: '16°C – 20°C',
    pressure: '5 – 20 atm',
    lightDescription: 'Những vệt nắng khúc xạ (Caustics) và bọt khí',
    accentColor: '#19A7C7',
    bgGradient: 'linear-gradient(180deg, #062B45 0%, #051C30 100%)',
  },
  twilight: {
    id: 'twilight',
    nameVi: 'Tầng Hoàng Hôn',
    nameEn: 'Twilight Zone',
    scientificName: 'Mesopelagic Lower',
    depthMin: 200,
    depthMax: 1000,
    temperature: '4°C – 10°C',
    pressure: '20 – 100 atm',
    lightDescription: 'Ánh sáng lam sẫm mờ ảo, bắt đầu xuất hiện đốm phát quang',
    accentColor: '#087EA4',
    bgGradient: 'linear-gradient(180deg, #051C30 0%, #041424 100%)',
  },
  deep: {
    id: 'deep',
    nameVi: 'Tầng Biển Thẳm',
    nameEn: 'Midnight Ocean',
    scientificName: 'Bathypelagic Zone',
    depthMin: 1000,
    depthMax: 4000,
    temperature: '2°C – 4°C',
    pressure: '100 – 400 atm',
    lightDescription: 'Bóng tối vĩnh hằng, sinh vật phát quang sinh học (Bioluminescence)',
    accentColor: '#7C3AED',
    bgGradient: 'linear-gradient(180deg, #041424 0%, #030C17 100%)',
  },
  abyss: {
    id: 'abyss',
    nameVi: 'Vực Thẳm Hadal',
    nameEn: 'The Hadal Abyss',
    scientificName: 'Abyssopelagic & Hadal',
    depthMin: 4000,
    depthMax: 11000,
    temperature: '1°C – 2°C',
    pressure: '400 – 1100 atm',
    lightDescription: 'Tĩnh lặng tuyệt đối, không gian vô cực của đại dương bí ẩn',
    accentColor: '#06B6D4',
    bgGradient: 'linear-gradient(180deg, #030C17 0%, #02060C 100%)',
  },
};

export interface OceanDepthState {
  depth: number; // in meters: 0 to 11,000
  zone: OceanZoneId;
  zoneInfo: OceanZoneInfo;
  progress: number; // 0.0 to 1.0 total scroll progress
  zoneProgress: number; // 0.0 to 1.0 progress within current zone
  scrollToDepth: (targetDepthMeters: number) => void;
  scrollToZone: (zoneId: OceanZoneId) => void;
}

const OceanDepthContext = createContext<OceanDepthState | null>(null);

export const OceanDepthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentProgress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
          setScrollProgress(currentProgress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Map progress (0 -> 1) into continuous depth (0 -> 11,000m)
  // We use a progressive curve so surface & shallow are spacious, then descent accelerates into the deep
  const depth = useMemo(() => {
    const p = scrollProgress;
    let computedDepth = 0;

    if (p <= 0.15) {
      // 0.00 -> 0.15: 0 to 50m (Surface)
      computedDepth = (p / 0.15) * 50;
    } else if (p <= 0.35) {
      // 0.15 -> 0.35: 50 to 200m (Shallow)
      computedDepth = 50 + ((p - 0.15) / 0.20) * 150;
    } else if (p <= 0.60) {
      // 0.35 -> 0.60: 200 to 1,000m (Twilight)
      computedDepth = 200 + ((p - 0.35) / 0.25) * 800;
    } else if (p <= 0.85) {
      // 0.60 -> 0.85: 1,000 to 4,000m (Deep Ocean)
      computedDepth = 1000 + ((p - 0.60) / 0.25) * 3000;
    } else {
      // 0.85 -> 1.00: 4,000 to 11,000m (Abyss / Hadal)
      computedDepth = 4000 + ((p - 0.85) / 0.15) * 7000;
    }

    return Math.round(computedDepth);
  }, [scrollProgress]);

  const zone: OceanZoneId = useMemo(() => {
    if (depth <= 50) return 'surface';
    if (depth <= 200) return 'shallow';
    if (depth <= 1000) return 'twilight';
    if (depth <= 4000) return 'deep';
    return 'abyss';
  }, [depth]);

  const zoneInfo = OCEAN_ZONES[zone];

  const zoneProgress = useMemo(() => {
    const range = zoneInfo.depthMax - zoneInfo.depthMin;
    if (range <= 0) return 0;
    return Math.min(1, Math.max(0, (depth - zoneInfo.depthMin) / range));
  }, [depth, zoneInfo]);

  const scrollToDepth = useCallback((targetDepthMeters: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;

    let targetProgress = 0;
    if (targetDepthMeters <= 50) {
      targetProgress = (targetDepthMeters / 50) * 0.15;
    } else if (targetDepthMeters <= 200) {
      targetProgress = 0.15 + ((targetDepthMeters - 50) / 150) * 0.20;
    } else if (targetDepthMeters <= 1000) {
      targetProgress = 0.35 + ((targetDepthMeters - 200) / 800) * 0.25;
    } else if (targetDepthMeters <= 4000) {
      targetProgress = 0.60 + ((targetDepthMeters - 1000) / 3000) * 0.25;
    } else {
      targetProgress = 0.85 + ((targetDepthMeters - 4000) / 7000) * 0.15;
    }

    const targetScrollTop = targetProgress * scrollHeight;
    window.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });
  }, []);

  const scrollToZone = useCallback((targetZoneId: OceanZoneId) => {
    const targetInfo = OCEAN_ZONES[targetZoneId];
    if (targetInfo) {
      scrollToDepth(targetInfo.depthMin + 1);
    }
  }, [scrollToDepth]);

  const value = useMemo<OceanDepthState>(
    () => ({
      depth,
      zone,
      zoneInfo,
      progress: scrollProgress,
      zoneProgress,
      scrollToDepth,
      scrollToZone,
    }),
    [depth, zone, zoneInfo, scrollProgress, zoneProgress, scrollToDepth, scrollToZone]
  );

  return <OceanDepthContext.Provider value={value}>{children}</OceanDepthContext.Provider>;
};

export function useOceanDepth(): OceanDepthState {
  const context = useContext(OceanDepthContext);
  if (!context) {
    throw new Error('useOceanDepth must be used within an OceanDepthProvider');
  }
  return context;
}
