export const EASE = {
  smooth:   [0.23, 1, 0.32, 1],
  snappy:   [0.55, 0, 0.1, 1],
  dramatic: [0.76, 0, 0.24, 1],
  bounce:   [0.34, 1.56, 0.64, 1],
} as const;

export const DURATION = {
  instant:  0.15,
  fast:     0.35,
  normal:   0.6,
  slow:     0.9,
  dramatic: 1.2,
} as const;

export const STAGGER = {
  tight:  0.04,
  normal: 0.08,
  loose:  0.14,
} as const;

// Framer Motion variants
export const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.smooth, delay: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: { duration: DURATION.fast, ease: EASE.snappy },
  },
};
