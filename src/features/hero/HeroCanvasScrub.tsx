'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  getHeroFramePath,
  HERO_FRAME_COUNT,
  HERO_FRAME_PRELOAD_COUNT,
} from './heroFrameConfig';
import { useLang } from '@/providers/LanguageProvider';

gsap.registerPlugin(ScrollTrigger);

// Highlights every character of the word "güllər" (all locales) with pink
const PINK_WORD_RE = /güllər|flowers|цветы/i;

function HeroTitleLine({ text }: { text: string }) {
  const match = text.match(PINK_WORD_RE);
  if (!match || match.index === undefined) return <>{text}</>;

  const before = text.slice(0, match.index);
  const word = match[0];
  const after = text.slice(match.index + word.length);

  return (
    <>
      {before}
      <span className="hero-title-pink" aria-label={word}>
        {word.split('').map((ch, i) => (
          <span key={i} className="hero-title-pink__char" style={{ animationDelay: `${i * 0.06}s` }}>
            {ch}
          </span>
        ))}
      </span>
      {after}
    </>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function HeroCanvasScrub() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stable refs — never trigger re-renders
  const framesRef = useRef<(HTMLImageElement | null)[]>(
    Array.from({ length: HERO_FRAME_COUNT }, () => null),
  );
  const loadedRef = useRef<boolean[]>(
    Array.from({ length: HERO_FRAME_COUNT }, () => false),
  );
  const currentFrameRef = useRef(0);
  const loadedCountRef = useRef(0);
  // Cache canvas size to avoid getBoundingClientRect on every draw
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  // rAF handle for batching draws
  const rafRef = useRef<number | null>(null);
  const pendingFrameRef = useRef<number | null>(null);

  const [isSequenceReady, setIsSequenceReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const { t } = useLang();

  // ── Canvas size sync ──────────────────────────────────────────────
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvasSizeRef.current = { w, h };
    }
  }, []);

  // ── Draw a single frame — no resize check inside hot path ─────────
  const drawFrame = useCallback((frameIndex: number): boolean => {
    const canvas = canvasRef.current;
    const image = framesRef.current[frameIndex];
    if (!canvas || !image || !loadedRef.current[frameIndex]) return false;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return false;

    const { w, h } = canvasSizeRef.current;
    if (w === 0 || h === 0) return false;

    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.drawImage(image, dx, dy, dw, dh);
    return true;
  }, []);

  // ── Nearest-frame fallback ────────────────────────────────────────
  const renderNearest = useCallback(
    (target: number) => {
      const bounded = clamp(target, 0, HERO_FRAME_COUNT - 1);
      if (drawFrame(bounded)) return;
      for (let d = 1; d < HERO_FRAME_COUNT; d++) {
        if (bounded - d >= 0 && drawFrame(bounded - d)) return;
        if (bounded + d < HERO_FRAME_COUNT && drawFrame(bounded + d)) return;
      }
    },
    [drawFrame],
  );

  // ── Batched rAF draw — prevents multiple draws in one frame ───────
  const scheduleRender = useCallback(
    (frameIndex: number) => {
      pendingFrameRef.current = frameIndex;
      if (rafRef.current !== null) return; // already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const f = pendingFrameRef.current;
        if (f !== null) renderNearest(f);
      });
    },
    [renderNearest],
  );

  // ── Frame loading ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    framesRef.current = Array.from({ length: HERO_FRAME_COUNT }, () => null);
    loadedRef.current = Array.from({ length: HERO_FRAME_COUNT }, () => false);
    loadedCountRef.current = 0;

    const loadFrame = (index: number) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = getHeroFramePath(index);

      img.onload = () => {
        if (cancelled) return;
        framesRef.current[index] = img;
        loadedRef.current[index] = true;
        loadedCountRef.current += 1;

        setLoadProgress(
          Math.round((loadedCountRef.current / HERO_FRAME_COUNT) * 100),
        );

        if (index === 0) {
          // Sync canvas size once first frame is known
          syncCanvasSize();
          setIsSequenceReady(true);
        }

        // Re-draw if this frame is what we're currently showing
        if (
          index === currentFrameRef.current ||
          loadedCountRef.current === 1
        ) {
          scheduleRender(currentFrameRef.current);
        }
      };
    };

    // Eager: preload first N frames
    for (let i = 0; i < Math.min(HERO_FRAME_PRELOAD_COUNT, HERO_FRAME_COUNT); i++) {
      loadFrame(i);
    }

    // Lazy: rest in idle time
    const loadRest = () => {
      for (let i = HERO_FRAME_PRELOAD_COUNT; i < HERO_FRAME_COUNT; i++) {
        loadFrame(i);
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(loadRest, { timeout: 2000 });
    } else {
      timeoutHandle = setTimeout(loadRest, 200);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [syncCanvasSize, scheduleRender]);

  // ── Canvas resize observer ────────────────────────────────────────
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ro = new ResizeObserver(() => {
      syncCanvasSize();
      scheduleRender(currentFrameRef.current);
    });
    ro.observe(section);
    return () => ro.disconnect();
  }, [syncCanvasSize, scheduleRender]);

  // ── GSAP scroll scrub ─────────────────────────────────────────────
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || !isSequenceReady) return;

      // Ensure canvas size is current before building tween
      syncCanvasSize();

      const playhead = { frame: 0 };

      const tween = gsap.to(playhead, {
        frame: HERO_FRAME_COUNT - 1,
        ease: 'none',
        duration: 1,
        onUpdate() {
          const f = Math.round(playhead.frame);
          currentFrameRef.current = f;
          scheduleRender(f);
        },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          // Scroll distance = 100vh feels natural for 120 frames
          end: '+=120vh',
          pin: true,
          // pinSpacing keeps layout intact so content below sits correctly
          pinSpacing: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh() {
            syncCanvasSize();
            scheduleRender(currentFrameRef.current);
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: sectionRef, dependencies: [isSequenceReady] },
  );

  return (
    <section ref={sectionRef} className="hero-video-shell">
      <div className="hero-video-backdrop" />

      <canvas
        ref={canvasRef}
        className={`hero-video-media${isSequenceReady ? ' is-ready' : ''}`}
        aria-hidden="true"
      />

      <div className="hero-video-overlay" />

      <div className="hero-video-copy">
        <p className="hero-video-kicker">{t('hero_kicker')}</p>
        <h1 className="hero-video-title">
          {t('hero_title')
            .split('\n')
            .map((line, i) => (
              <span key={i} style={{ display: 'block' }}>
                <HeroTitleLine text={line} />
              </span>
            ))}
        </h1>
        <p className="hero-video-subtitle">{t('hero_subtitle')}</p>
      </div>

      {!isSequenceReady && (
        <div className="hero-sequence-status">
          {t('hero_loading')} {loadProgress}%
        </div>
      )}
    </section>
  );
}
