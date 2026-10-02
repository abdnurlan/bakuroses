'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Sets `data-revealed` on the element the first time it scrolls into view;
 * CSS does the animating. No React state, so revealing never re-renders.
 */
export function useRevealOnce(
  ref: RefObject<Element | null>,
  threshold = 0.2,
  rootMargin = '0px 0px -10% 0px',
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.setAttribute('data-revealed', '');
        io.disconnect();
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, rootMargin]);
}
