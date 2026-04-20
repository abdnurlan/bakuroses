'use client';

import { useEffect, useRef, useState } from 'react';

export function useHeaderCondensed(threshold = 8, hysteresis = 24) {
  const [isCondensed, setIsCondensed] = useState(false);
  const lastState = useRef(false);
  const ticking = useRef(false);

  useEffect(() => {
    const condenseY = threshold;
    const expandY = Math.max(0, threshold - hysteresis);

    const update = () => {
      ticking.current = false;
      const y = window.scrollY;
      let next = lastState.current;
      if (!lastState.current && y >= condenseY) next = true;
      else if (lastState.current && y <= expandY) next = false;
      if (next !== lastState.current) {
        lastState.current = next;
        setIsCondensed(next);
      }
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, hysteresis]);

  return isCondensed;
}
