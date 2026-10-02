'use client';

import { useRef, type CSSProperties } from 'react';
import { useRevealOnce } from '@/hooks/useRevealOnce';

type TitleTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type AnimatedTitleRevealProps = {
  as?: TitleTag;
  className?: string;
  delay?: number;
  id?: string;
  text: string;
};

// Letter-by-letter rise. Each letter is a plain span animated by a CSS transition
// staggered through `--i` (see `.title-reveal` in globals.css), so a heading costs
// one IntersectionObserver instead of an animation controller per letter.
export function AnimatedTitleReveal({
  as,
  className,
  delay = 0,
  id,
  text,
}: AnimatedTitleRevealProps) {
  const Component = as ?? 'h2';
  const ref = useRef<HTMLSpanElement>(null);
  useRevealOnce(ref, 0.35);

  const lines = text.split('\n').map((line) => Array.from(line));
  const lineStarts = lines.map((_, i) => lines.slice(0, i).reduce((n, l) => n + l.length, 0));

  return (
    <Component id={id} className={className} aria-label={text}>
      <span
        ref={ref}
        aria-hidden="true"
        className="title-reveal"
        style={{ '--reveal-delay': `${delay}s` } as CSSProperties}
      >
        {lines.map((chars, lineIndex) => (
          <span key={lineIndex} style={{ display: 'block' }}>
            {chars.map((char, charIndex) => (
              <span key={charIndex} className="title-reveal__wrap">
                <span
                  className="title-reveal__char"
                  style={{ '--i': lineStarts[lineIndex] + charIndex } as CSSProperties}
                >
                  {char === ' ' ? ' ' : char}
                </span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </Component>
  );
}
