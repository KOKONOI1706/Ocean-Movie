import React from 'react';
import { MediaItem } from '../types.js';
import { HeroSection } from './hero/HeroSection.js';

interface HeroProps {
  featuredItem?: MediaItem;
  featuredItems?: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onTriggerAISearch?: (query?: string) => void;
  onStartDive?: () => void;
  onToggleSave?: (item: MediaItem) => void;
  savedItemIds?: string[];
}

export const Hero: React.FC<HeroProps> = ({
  featuredItem,
  featuredItems = [],
  onSelectMedia,
  onTriggerAISearch,
  onToggleSave,
  savedItemIds,
}) => {
  return (
    <HeroSection
      items={featuredItems}
      fallbackItem={featuredItem}
      onSelectMedia={onSelectMedia}
      onTriggerAISearch={onTriggerAISearch}
      onToggleSave={onToggleSave}
      savedItemIds={savedItemIds}
    />
  );
};
