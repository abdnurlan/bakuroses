'use client';

import { motion } from 'framer-motion';

const spokes = [0, 30, 60, 90, 120, 150];

function Wheel({ cx, cy, r = 58 }: { cx: number; cy: number; r?: number }) {
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={{ rotate: -1440 }}
      transition={{ duration: 2.8, ease: 'easeOut' }}
    >
      <circle cx={cx} cy={cy} r={r} fill="#1a1118" />
      <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke="#2e2430" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r - 14} fill="#f5f0f3" stroke="#2a1f27" strokeWidth="7" />
      <circle cx={cx} cy={cy} r={16} fill="#d8d0cb" stroke="#1a1118" strokeWidth="3.5" />
      <circle cx={cx} cy={cy} r={6} fill="#c8c0bb" />
      {spokes.map((angle) => (
        <line
          key={angle}
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - (r - 16)}
          stroke="#a09298"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${angle} ${cx} ${cy})`}
        />
      ))}
    </motion.g>
  );
}

function RearSmoke() {
  return (
    <motion.g
      initial={{ opacity: 0, x: 0 }}
      animate={{ opacity: [0, 0.9, 0.5, 0], x: [0, -55, -110, -175], y: [0, -4, 5, 2] }}
      transition={{ duration: 2.4, ease: 'easeOut', times: [0, 0.28, 0.65, 1] }}
    >
      <ellipse cx="200" cy="298" rx="22" ry="14" fill="#cf6f94" opacity="0.18" />
      <ellipse cx="156" cy="306" rx="17" ry="11" fill="#8b9770" opacity="0.15" />
      <ellipse cx="110" cy="300" rx="13" ry="9" fill="#cf6f94" opacity="0.11" />
      <path d="M218 295c-40-6-78-2-110 14" stroke="#cf6f94" strokeWidth="6" strokeLinecap="round" opacity="0.22" />
    </motion.g>
  );
}

function MotorcycleAsset() {
  return (
    <motion.div
      initial={{ x: '-65vw', y: 22, rotate: -6, scale: 0.94 }}
      animate={{ x: ['-65vw', '6vw', '0vw'], y: [22, -10, 0], rotate: [-6, 2.5, 0], scale: [0.94, 1.02, 1] }}
      transition={{ duration: 2.4, ease: [0.22, 0.9, 0.18, 1], times: [0, 0.8, 1] }}
      style={{
        width: 'min(88vw, 820px)',
        transformOrigin: '54% 76%',
        filter: 'drop-shadow(0 28px 36px rgba(49,41,44,0.28))',
        willChange: 'transform',
      }}
    >
      <svg
        viewBox="0 0 820 430"
        role="img"
        aria-label="Çatdırılma skuteri və kuryer"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="roseBody" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ff85b8" />
            <stop offset="0.45" stopColor="#d6347a" />
            <stop offset="1" stopColor="#8c2256" />
          </linearGradient>
          <linearGradient id="darkFrame" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#2e2030" />
            <stop offset="1" stopColor="#0e0a0d" />
          </linearGradient>
          <linearGradient id="seatGrad" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#3a2838" />
            <stop offset="1" stopColor="#1a1018" />
          </linearGradient>
          <linearGradient id="boxFace" x1="0" y1="0" x2="0.4" y2="1">
            <stop stopColor="#fce8f0" />
            <stop offset="1" stopColor="#e8a4c0" />
          </linearGradient>
          <linearGradient id="boxSide" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#d4789c" />
            <stop offset="1" stopColor="#a8486e" />
          </linearGradient>
          <linearGradient id="helmetGrad" x1="0" y1="0" x2="0.6" y2="1">
            <stop stopColor="#2e2030" />
            <stop offset="0.6" stopColor="#1a1018" />
            <stop offset="1" stopColor="#0e080c" />
          </linearGradient>
          <linearGradient id="visorGrad" x1="0" y1="0" x2="0.3" y2="1">
            <stop stopColor="#ffdcec" stopOpacity="0.92" />
            <stop offset="0.5" stopColor="#ff9ec8" stopOpacity="0.7" />
            <stop offset="1" stopColor="#d6347a" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="suitFront" x1="0" y1="0" x2="0.5" y2="1">
            <stop stopColor="#e83a88" />
            <stop offset="1" stopColor="#9a1c54" />
          </linearGradient>
          <linearGradient id="suitDark" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#2a1c26" />
            <stop offset="1" stopColor="#150e13" />
          </linearGradient>
          <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#e8e0da" />
            <stop offset="0.5" stopColor="#a09890" />
            <stop offset="1" stopColor="#d4ccc4" />
          </linearGradient>
          <radialGradient id="lamp" cx="40%" cy="38%" r="62%">
            <stop stopColor="#fffef5" />
            <stop offset="0.55" stopColor="#ffe59a" />
            <stop offset="1" stopColor="#d08828" />
          </radialGradient>
        </defs>

        <ellipse cx="430" cy="368" rx="295" ry="22" fill="#31292c" opacity="0.07" />
        <RearSmoke />

        <path d="M268 312c-30 5-54 2-72-8" stroke="url(#chrome)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M280 300c40-8 78-10 118-6" stroke="#1a1018" strokeWidth="16" strokeLinecap="round" fill="none" />
        <path d="M300 280c60-18 130-22 200-14" stroke="url(#darkFrame)" strokeWidth="18" strokeLinecap="round" fill="none" />

        <Wheel cx={248} cy={308} r={58} />
        <Wheel cx={584} cy={308} r={58} />

        <path
          d="M272 255c8-42 28-74 62-94l80-10c54-4 100 18 128 60l22 62H256z"
          fill="url(#roseBody)"
          stroke="#5a1535"
          strokeWidth="4"
        />
        <path d="M320 238c14-30 38-50 72-58l60-4c30 2 56 14 76 38l14 38H312z" fill="url(#darkFrame)" opacity="0.85" />
        <path d="M338 248h148M330 260h160M325 272h166" stroke="#4a3040" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
        <path
          d="M400 158c28-12 62-16 98-10l70 16c28 8 50 26 64 52l14 42H390c-20 0-36-14-38-34l-4-42c2-14 20-20 52-24z"
          fill="#e84e90"
          stroke="#7a1a42"
          strokeWidth="4"
        />
        <path d="M348 220c24-6 54-8 90-6l110 4c14 0 24 10 24 24v20H340c-8 0-12-6-12-14v-10c0-10 8-16 20-18z" fill="url(#seatGrad)" stroke="#1a1018" strokeWidth="3" />
        <path d="M554 160c48 32 82 80 100 148" stroke="url(#darkFrame)" strokeWidth="14" strokeLinecap="round" fill="none" />
        <path d="M605 188c20-10 44-12 68-5" stroke="#1a1018" strokeWidth="10" strokeLinecap="round" fill="none" />
        <ellipse cx="684" cy="205" rx="28" ry="24" fill="#2a1f27" stroke="#1a1018" strokeWidth="4" />
        <ellipse cx="684" cy="205" rx="20" ry="17" fill="url(#lamp)" />
        <path d="M624 258c18 12 34 28 44 50" stroke="url(#roseBody)" strokeWidth="14" strokeLinecap="round" fill="none" />

        <path d="M168 115h122c10 0 18 8 18 18v78c0 10-8 18-18 18H168c-10 0-18-8-18-18v-78c0-10 8-18 18-18z" fill="url(#boxFace)" stroke="#8a3058" strokeWidth="4" />
        <path d="M290 115l28-18v96l-28 18z" fill="url(#boxSide)" stroke="#7a2848" strokeWidth="2" />
        <path d="M168 115l28-18h122l-28 18z" fill="#f0d0e0" stroke="#8a3058" strokeWidth="2" />
        <rect x="176" y="138" width="108" height="32" rx="14" fill="rgba(255,248,251,0.9)" stroke="rgba(200,140,168,0.4)" strokeWidth="1.5" />
        <text x="230" y="159" textAnchor="middle" fill="#8a2250" fontFamily="Inter,Arial,sans-serif" fontSize="14" fontWeight="800" letterSpacing="0.5">
          Baku Rose
        </text>
        <rect x="224" y="130" width="12" height="8" rx="3" fill="#c06080" stroke="#8a3058" strokeWidth="1.5" />
        <path d="M190 229c24 16 56 24 96 24" stroke="#1a1018" strokeWidth="11" strokeLinecap="round" fill="none" />

        <path d="M348 148c-6 16-10 36-10 60l4 52c2 10 10 16 20 14l28-4c10-2 16-10 14-20l-8-56c-4-26-2-46 6-58z" fill="url(#suitDark)" stroke="#1a1018" strokeWidth="3" />
        <path d="M376 136c20-8 44-10 66-4l24 8c14 6 22 20 22 36v50c0 12-8 22-20 24l-30 4c-12 2-24-6-28-18l-10-44c-4-20-4-40 0-54l-24-2z" fill="url(#suitFront)" stroke="#7a1240" strokeWidth="3" />
        <path d="M464 148c18 8 34 22 46 42l14 26" stroke="url(#suitFront)" strokeWidth="20" strokeLinecap="round" fill="none" />
        <path d="M524 216c16 8 30 14 42 16" stroke="url(#suitDark)" strokeWidth="17" strokeLinecap="round" fill="none" />
        <path d="M380 148c-16 14-26 32-32 56" stroke="url(#suitFront)" strokeWidth="20" strokeLinecap="round" fill="none" />
        <path d="M348 204c-10 18-20 36-32 48" stroke="url(#suitDark)" strokeWidth="17" strokeLinecap="round" fill="none" />
        <path d="M348 258c16-4 36-6 56-4l30 4" fill="none" stroke="url(#suitDark)" strokeWidth="22" strokeLinecap="round" />
        <path d="M372 260c-4 24-2 46 6 66M420 262c6 22 8 44 4 64" stroke="url(#suitFront)" strokeWidth="20" strokeLinecap="round" fill="none" />
        <path d="M378 326c4 18 12 32 22 40M424 326c2 16 6 30 12 40" stroke="url(#suitDark)" strokeWidth="17" strokeLinecap="round" fill="none" />
        <path d="M398 364c4 6 8 12 10 18l2 8c0 4-2 6-6 6h-28c-4 0-6-2-6-6v-4c0-4 4-8 10-10l8-12z" fill="#120810" />
        <path d="M434 364c2 6 4 12 4 18v8c0 4-2 6-6 6h-24c-4 0-6-2-6-6v-4c0-4 4-8 8-10l10-12z" fill="#120810" />
        <path d="M438 108c4 12 6 24 6 36" stroke="#e8c0cc" strokeWidth="14" strokeLinecap="round" fill="none" />
        <ellipse cx="462" cy="74" rx="56" ry="52" fill="url(#helmetGrad)" stroke="#0e080c" strokeWidth="4" />
        <path d="M414 90c4 18 14 32 28 40l20 8c12 4 24 2 34-6l16-14c4-6 6-14 4-22" fill="#1a1018" stroke="#0e080c" strokeWidth="3" />
        <path d="M422 72c2-14 12-26 24-32l18-6c14-2 28 4 36 16l8 14c2 6 2 12 0 18h-86z" fill="url(#visorGrad)" stroke="rgba(220,120,160,0.6)" strokeWidth="2" />
      </svg>
    </motion.div>
  );
}

export function DeliverySuccessOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,248,251,0.97)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '64%',
          minHeight: 320,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0 1rem',
        }}
      >
        <MotorcycleAsset />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1], delay: 0.6 }}
        style={{ textAlign: 'center', padding: '0 2rem' }}
      >
        <p
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            margin: '0 0 0.6rem',
          }}
        >
          Sifarişiniz qəbul edildi
        </p>
        <p
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.4rem)',
            fontWeight: 600,
            color: 'var(--color-text)',
            lineHeight: 1.15,
            margin: '0 0 0.75rem',
            fontFamily: 'var(--font-display, serif)',
          }}
        >
          Yolda olacaq!
        </p>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Sifarişiniz hazırlanır, tezliklə çatdırılacaq.
        </p>
      </motion.div>
    </div>
  );
}
