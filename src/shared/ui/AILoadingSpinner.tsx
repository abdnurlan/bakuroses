'use client';

import { motion } from 'framer-motion';

export function AILoadingSpinner() {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div
      style={{ position: 'relative', width: '80px', height: '80px' }}
      role="status"
      aria-label="Loading"
    >
      {petals.map((deg, i) => (
        <motion.div
          key={deg}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale:   [0.8, 1.1, 0.8],
            y:       [0, -4, 0],
          }}
          transition={{
            duration: 1.6,
            repeat:   Infinity,
            delay:    i * 0.2,
            ease:     'easeInOut',
          }}
          style={{
            position:         'absolute',
            top:              '50%',
            left:             '50%',
            width:            '12px',
            height:           '20px',
            borderRadius:     '9999px',
            backgroundColor:  '#ff94ae',
            transform:        `rotate(${deg}deg) translateY(-140%)`,
            transformOrigin:  'bottom center',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width:           '12px',
            height:          '12px',
            borderRadius:    '9999px',
            backgroundColor: '#2abf6a',
          }}
        />
      </div>
    </div>
  );
}
