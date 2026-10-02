'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useRevealOnce } from '@/hooks/useRevealOnce';

type Variant = 'slide-up' | 'fade' | 'split-text';

interface Props {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}

// CSS-driven reveal (see `.reveal` in globals.css): the browser animates
// opacity/transform on the compositor; JS only flags the element once.
export function RevealOnScroll({ children, variant = 'slide-up', delay = 0, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useRevealOnce(ref);

  return (
    <div
      ref={ref}
      className={['reveal', variant === 'fade' ? 'reveal--fade' : 'reveal--up', className].filter(Boolean).join(' ')}
      style={{ ...style, '--reveal-delay': `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
