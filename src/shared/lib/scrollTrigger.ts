import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/**
 * Registers ScrollTrigger on first use instead of at module scope.
 *
 * `gsap.registerPlugin(ScrollTrigger)` calls `ScrollTrigger.enable()`, which
 * attaches its listeners and forces a full synchronous layout. At module scope
 * that lands in the middle of hydration — profiling the homepage put it at
 * ~1s of blocked main thread on a 4x-throttled CPU, before React had rendered
 * anything, which in turn starved the hero frame sequence of idle time.
 *
 * Call this from an effect, so the layout it forces happens after first paint.
 */
export function ensureScrollTrigger(): typeof ScrollTrigger {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return ScrollTrigger;
}

export { ScrollTrigger };
