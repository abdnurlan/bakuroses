import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function createLenis(): Lenis {
  lenisInstance?.destroy();
  lenisInstance = new Lenis({
    // 0.2 keeps the wheel smooth without the "heavy", lagging feel of low lerp values.
    // Touch scrolling stays native (Lenis only smooths the wheel by default).
    lerp: 0.2,
    autoRaf: true,
    // pauses itself whenever <html> gets overflow: hidden (modals, drawers)
    autoToggle: true,
  });
  return lenisInstance;
}

/** null when smooth scrolling is off (reduced motion) or not mounted yet */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function destroyLenis() {
  lenisInstance?.destroy();
  lenisInstance = null;
}

/**
 * `lock` holds the glide against wheel and touch input until it lands (trackpad momentum would cut it short);
 * `onComplete` runs when it lands, unless a later scrollToY replaced it first
 */
export function scrollToY(
  top: number,
  opts: { duration?: number; easing?: (t: number) => number; lock?: boolean; onComplete?: () => void } = {},
) {
  if (lenisInstance) {
    lenisInstance.scrollTo(top, {
      duration: opts.duration ?? 1.1,
      easing: opts.easing,
      lock: opts.lock,
      force: opts.lock,
      onComplete: opts.onComplete,
    });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  if (opts.onComplete) window.setTimeout(opts.onComplete, (opts.duration ?? 1.1) * 1000);
}

/** ends a running glide where the page is and gives the wheel back to Lenis */
export function releaseScroll() {
  lenisInstance?.scrollTo(window.scrollY, { immediate: true, force: true });
}
