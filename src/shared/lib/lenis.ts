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
