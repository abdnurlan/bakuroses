export const HERO_FRAME_COUNT = 144;
export const HERO_FRAME_PRELOAD_COUNT = 30;

export function getHeroFramePath(index: number): string {
  return `/hero-frames/frame-${String(index + 1).padStart(4, '0')}.webp`;
}
