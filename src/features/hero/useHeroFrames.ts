'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';
import { FrameDecoder } from './frameDecoder';
import { getHeroFramePath, HERO_MOBILE_QUERY, HERO_SPECS, loadOrder, type HeroVariant } from './heroFrameConfig';

const DECODERS = 2; // concurrent worker decodes
// concurrent frame downloads: frames are small, so first-visit loading is bound by
// per-request latency (~250 ms origin TTFB), not bandwidth — HTTP/2 multiplexes these
const FETCHERS = 24;
const AHEAD = 10; // frames kept decoded ahead of the playhead, in the scroll direction
const BEHIND = 3;

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(HERO_MOBILE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const clientVariant = (): HeroVariant => (window.matchMedia(HERO_MOBILE_QUERY).matches ? 'mobile' : 'desktop');
const serverVariant = (): HeroVariant => 'desktop';

function around(base: number, dir: number, count: number): number[] {
  const out: number[] = [];
  const push = (i: number) => {
    if (i >= 0 && i < count && !out.includes(i)) out.push(i);
  };
  push(base);
  for (let k = 1; k <= AHEAD; k++) {
    push(base + k * dir);
    if (k <= BEHIND) push(base - k * dir);
  }
  return out;
}

export type HeroFrames = {
  variant: HeroVariant;
  count: number;
  bitmapsRef: RefObject<Array<ImageBitmap | null>>;
  loadedRef: RefObject<boolean[]>;
  /** where the playhead is, so frames around it are decoded first */
  want: (pos: number, dir: number) => void;
};

/**
 * Streams the hero frames as ImageBitmaps decoded off the main thread, keeping
 * only a window of them around the playhead in memory. `onDecodedRef` is called
 * whenever a frame lands, so an idle canvas can redraw.
 */
export function useHeroFrames(active: boolean, onDecodedRef: RefObject<() => void>): HeroFrames {
  const variant = useSyncExternalStore(subscribe, clientVariant, serverVariant);
  const bitmapsRef = useRef<Array<ImageBitmap | null>>([]);
  const loadedRef = useRef<boolean[]>([]);
  const wantedRef = useRef<(pos: number, dir: number) => void>(() => {});
  const want = useCallback((pos: number, dir: number) => wantedRef.current(pos, dir), []);

  useEffect(() => {
    if (!active) return;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;

    const { count, step, head, maxDecoded } = HERO_SPECS[variant];
    bitmapsRef.current = new Array<ImageBitmap | null>(count).fill(null);
    loadedRef.current = new Array<boolean>(count).fill(false);
    const bitmaps = bitmapsRef.current;
    const loaded = loadedRef.current;
    const cached = new Set<number>();
    const inflight = new Set<number>();
    let queue = [...new Set([...Array.from({ length: head }, (_, i) => i), ...around(0, 1, count)])];
    let playhead = 0;
    let decoder: FrameDecoder | null = null;
    let cancelled = false;

    // drop the decoded frames farthest from the playhead
    const evict = () => {
      while (cached.size > maxDecoded) {
        let victim = -1;
        let far = -1;
        for (const i of cached) {
          const d = Math.abs(i - playhead);
          if (d > far) {
            far = d;
            victim = i;
          }
        }
        if (victim < 0) break;
        bitmaps[victim]?.close();
        bitmaps[victim] = null;
        loaded[victim] = false;
        cached.delete(victim);
      }
    };

    const pump = () => {
      if (!decoder || cancelled) return;
      for (const i of queue) {
        if (inflight.size >= DECODERS) return;
        if (loaded[i] || inflight.has(i)) continue;
        inflight.add(i);
        void decoder.decode(i).then((bmp) => {
          inflight.delete(i);
          if (cancelled) return bmp?.close();
          if (bmp) {
            bitmaps[i]?.close();
            bitmaps[i] = bmp;
            loaded[i] = true;
            cached.add(i);
            evict();
            onDecodedRef.current();
          }
          pump();
        });
      }
    };

    wantedRef.current = (pos, dir) => {
      const base = Math.min(count - 1, Math.max(0, Math.floor(pos)));
      const stepDir = dir < 0 ? -1 : 1;
      if (base !== playhead || queue[1] !== Math.min(count - 1, Math.max(0, base + stepDir))) {
        playhead = base;
        queue = around(base, stepDir, count);
      }
      pump();
    };

    // Frames wait for window load so they never compete with the page's own critical requests
    const start = () => {
      if (cancelled) return;
      const urls = Array.from(
        { length: count },
        (_, i) => new URL(getHeroFramePath(i * step), window.location.href).href,
      );
      decoder = new FrameDecoder(urls, loadOrder(count, head), FETCHERS);
      pump();
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
      wantedRef.current = () => {};
      decoder?.dispose();
      for (const b of bitmaps) b?.close();
      bitmapsRef.current = [];
      loadedRef.current = [];
    };
  }, [active, variant, onDecodedRef]);

  return { variant, count: HERO_SPECS[variant].count, bitmapsRef, loadedRef, want };
}
