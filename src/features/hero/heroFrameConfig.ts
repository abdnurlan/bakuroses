export const HERO_FRAME_COUNT = 120;
export const HERO_FRAME_COUNT_MOBILE = 60;
// Preload first 20 frames immediately; rest load in idle time
export const HERO_FRAME_PRELOAD_COUNT = 20;
export const HERO_FRAME_PRELOAD_COUNT_MOBILE = 12;

export function getEffectiveFrameCount(): number {
  if (typeof window === 'undefined') return HERO_FRAME_COUNT;
  return window.innerWidth < 768 ? HERO_FRAME_COUNT_MOBILE : HERO_FRAME_COUNT;
}

export function getEffectivePreloadCount(): number {
  if (typeof window === 'undefined') return HERO_FRAME_PRELOAD_COUNT;
  return window.innerWidth < 768 ? HERO_FRAME_PRELOAD_COUNT_MOBILE : HERO_FRAME_PRELOAD_COUNT;
}

export function getMobileFrameIndex(index: number, totalFrames: number, mobileCount: number): number {
  const step = Math.floor(totalFrames / mobileCount);
  return index * step;
}

export function getHeroFramePath(index: number): string {
  return `/hero-frames/frame-${String(index + 1).padStart(4, '0')}.webp`;
}
