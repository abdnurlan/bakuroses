'use client';

import { ElementType, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { DURATION } from '@/lib/animation-tokens';

gsap.registerPlugin(ScrollTrigger);

type AnimatedTitleRevealProps<T extends ElementType> = {
  as?: T;
  className?: string;
  delay?: number;
  text: string;
};

export function AnimatedTitleReveal<T extends ElementType = 'h2'>({
  as,
  className,
  delay = 0,
  text,
}: AnimatedTitleRevealProps<T>) {
  const Component = (as ?? 'h2') as ElementType;
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;

      const chars = el.querySelectorAll<HTMLElement>('[data-char]');
      const wrappers = el.querySelectorAll<HTMLElement>('[data-char-wrap]');

      gsap.set(wrappers, { overflow: 'hidden' });
      gsap.set(chars, {
        yPercent: 115,
        opacity: 0,
        rotateZ: 1.5,
        filter: 'blur(6px)',
      });

      gsap.to(chars, {
        yPercent: 0,
        opacity: 1,
        rotateZ: 0,
        filter: 'blur(0px)',
        duration: DURATION.normal,
        ease: 'power3.out',
        stagger: 0.018,
        delay,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    },
    { scope: ref, dependencies: [text, delay] }
  );

  return (
    <Component ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">
        {Array.from(text).map((char, index) => (
          <span
            key={`${char}-${index}`}
            data-char-wrap
            style={{ display: 'inline-block', verticalAlign: 'top' }}
          >
            <span
              data-char
              style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          </span>
        ))}
      </span>
    </Component>
  );
}
