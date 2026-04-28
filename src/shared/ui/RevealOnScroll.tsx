'use client';

import { ReactNode, CSSProperties, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DURATION, EASE } from '@/lib/animation-tokens';

type Variant = 'slide-up' | 'fade' | 'split-text';

interface Props {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}

export function RevealOnScroll({ children, variant = 'slide-up', delay = 0, style, className }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [done, setDone] = useState(false);

  const hiddenState =
    variant === 'fade'
      ? { opacity: 0, scale: 1.015 }
      : { opacity: 0, y: 28 };

  const visibleState =
    variant === 'fade'
      ? { opacity: 1, scale: 1 }
      : { opacity: 1, y: 0 };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : hiddenState}
      whileInView={visibleState}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -10% 0px' }}
      transition={{ duration: DURATION.normal, ease: EASE.smooth, delay }}
      onAnimationComplete={() => setDone(true)}
      style={{ ...style, willChange: done ? 'auto' : 'transform, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
