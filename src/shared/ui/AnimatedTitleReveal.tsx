'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { DURATION, EASE } from '@/lib/animation-tokens';

type TitleTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type AnimatedTitleRevealProps = {
  as?: TitleTag;
  className?: string;
  delay?: number;
  id?: string;
  text: string;
};

export function AnimatedTitleReveal({
  as,
  className,
  delay = 0,
  id,
  text,
}: AnimatedTitleRevealProps) {
  const Component = as ?? 'h2';
  const shouldReduceMotion = useReducedMotion();
  const lines = text.split('\n');

  return (
    <Component id={id} className={className} aria-label={text}>
      <motion.span
        aria-hidden="true"
        initial={shouldReduceMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.35, margin: '0px 0px -10% 0px' }}
        transition={{ staggerChildren: 0.018, delayChildren: delay }}
        style={{ display: 'inline-block' }}
      >
        {lines.map((line, lineIndex) => (
          <span key={`${line}-${lineIndex}`} style={{ display: 'block' }}>
            {Array.from(line).map((char, charIndex) => (
              <span
                key={`${char}-${lineIndex}-${charIndex}`}
                data-char-wrap
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  paddingBottom: '0.14em',
                  marginBottom: '-0.14em',
                  verticalAlign: 'baseline',
                }}
              >
                <motion.span
                  data-char
                  variants={{
                    hidden: {
                      y: '115%',
                      opacity: 0,
                      rotateZ: 1.5,
                      filter: 'blur(6px)',
                    },
                    visible: {
                      y: '0%',
                      opacity: 1,
                      rotateZ: 0,
                      filter: 'blur(0px)',
                    },
                  }}
                  transition={{
                    duration: DURATION.normal,
                    ease: EASE.smooth,
                  }}
                  style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              </span>
            ))}
          </span>
        ))}
      </motion.span>
    </Component>
  );
}
