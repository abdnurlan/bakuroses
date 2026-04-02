'use client';

import { useRef, ReactNode, CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { DURATION } from '@/lib/animation-tokens';

gsap.registerPlugin(ScrollTrigger);

type Variant = 'slide-up' | 'fade' | 'split-text';

interface Props {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}

export function RevealOnScroll({ children, variant = 'slide-up', delay = 0, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;

      if (variant === 'slide-up') {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28, filter: 'blur(2px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: DURATION.normal,
            ease: `power3.out`,
            delay,
            scrollTrigger: {
              trigger: el,
              start:   'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      if (variant === 'fade') {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 1.015 },
          {
            opacity: 1,
            scale: 1,
            duration: DURATION.normal,
            ease: 'power2.out',
            delay,
            scrollTrigger: {
              trigger: el,
              start:   'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      if (variant === 'split-text') {
        // Manual word split
        const text = el.innerText;
        el.innerHTML = text
          .split(' ')
          .map((word, i) => `<span style="display:inline-block;overflow:hidden;margin-right:0.3em"><span class="word-${i}" style="display:inline-block;transform:translateY(115%);opacity:0">${word}</span></span>`)
          .join('');

        const words = el.querySelectorAll<HTMLElement>('[class^="word-"]');
        gsap.to(words, {
          y: 0,
          opacity: 1,
          duration: DURATION.normal,
          ease: 'power3.out',
          stagger: 0.035,
          delay,
          scrollTrigger: {
            trigger: el,
            start:   'top 85%',
            toggleActions: 'play none none none',
          },
        });
      }
    },
    { scope: ref, dependencies: [variant, delay] }
  );

  return (
    <div ref={ref} style={{ ...style, willChange: 'transform, opacity' }} className={className}>
      {children}
    </div>
  );
}
