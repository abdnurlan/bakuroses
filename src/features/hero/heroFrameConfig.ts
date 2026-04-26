export const HERO_FRAME_COUNT = 120;
// Preload first 20 frames immediately; rest load in idle time
export const HERO_FRAME_PRELOAD_COUNT = 20;

export function getHeroFramePath(index: number): string {
  return `/hero-frames/frame-${String(index + 1).padStart(4, '0')}.webp`;
}
