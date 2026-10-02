export type HeroVariant = 'desktop' | 'mobile';

export const HERO_MOBILE_QUERY = '(max-width: 767px)';

// Source frames on disk: frame-0001…frame-0120.webp, 1280×720
export const HERO_FRAME_COUNT = 120;
export const HERO_FRAME_WIDTH = 1280;
export const HERO_FRAME_HEIGHT = 720;
// Bump when the frames on disk change — they're served with an immutable cache header
export const HERO_FRAMES_VERSION = '1';

export const HERO_SPECS: Record<HeroVariant, { count: number; step: number; head: number; maxDecoded: number }> = {
  // head: frames decoded before the scrub starts; maxDecoded: bitmaps kept in memory (~3.7 MB each)
  desktop: { count: HERO_FRAME_COUNT, step: 1, head: 10, maxDecoded: 28 },
  // phones get every 2nd frame
  mobile: { count: HERO_FRAME_COUNT / 2, step: 2, head: 6, maxDecoded: 20 },
};

export function getHeroFramePath(index: number): string {
  return `/hero-frames/frame-${String(index + 1).padStart(4, '0')}.webp?v=${HERO_FRAMES_VERSION}`;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** object-fit: cover for a canvas draw */
export function coverRect(cw: number, ch: number, iw: number, ih: number) {
  const scale = Math.max(cw / iw, ch / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}

/** canvas backing-store density: never more pixels than the source frames carry, never above 2× */
export function canvasDensity(cssW: number, cssH: number, dpr: number): number {
  const fill = Math.min(HERO_FRAME_WIDTH / cssW, HERO_FRAME_HEIGHT / cssH);
  return Math.min(dpr, 2, Math.max(1, fill));
}

/** frame-rate independent exponential follow */
export function approach(current: number, goal: number, dtMs: number, tauMs: number): number {
  return goal + (current - goal) * Math.exp(-dtMs / tauMs);
}

export const REST_AFTER_MS = 120;

/** once the scroll has rested, settle on a whole frame so the still image is crisp (no crossfade) */
export function restGoal(target: number, idleMs: number): number {
  return idleMs >= REST_AFTER_MS ? Math.round(target) : target;
}

export function nearestLoaded(index: number, loaded: readonly boolean[]): number {
  if (loaded[index]) return index;
  for (let d = 1; d < loaded.length; d++) {
    if (loaded[index - d]) return index - d;
    if (loaded[index + d]) return index + d;
  }
  return -1;
}

/** first `head` frames and the last one, then coarse-to-fine so any scroll position soon has a nearby frame */
export function loadOrder(count: number, head: number): number[] {
  const order = Array.from({ length: Math.min(head, count) }, (_, i) => i);
  if (count > head) order.push(count - 1);
  const seen = new Set(order);
  let step = 1;
  while (step * 2 < count) step *= 2;
  for (; step >= 1; step = Math.floor(step / 2)) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
    if (step === 1) break;
  }
  return order;
}
