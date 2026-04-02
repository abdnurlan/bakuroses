import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis {
  if (typeof window === 'undefined') throw new Error('Lenis is client-only');
  if (!lenisInstance) {
    lenisInstance = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      duration: 1.2,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.15,
    });
  }
  return lenisInstance;
}

export function destroyLenis() {
  lenisInstance?.destroy();
  lenisInstance = null;
}
