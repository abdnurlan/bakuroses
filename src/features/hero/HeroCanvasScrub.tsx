'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ensureScrollTrigger } from '@/shared/lib/scrollTrigger';
import {
  getHeroFramePath,
  HERO_FRAME_COUNT,
  HERO_FRAME_COUNT_MOBILE,
  getEffectiveFrameCount,
  getEffectivePreloadCount,
  getMobileFrameIndex,
} from './heroFrameConfig';
import { useLang } from '@/providers/LanguageProvider';

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

  const isMobileRef = useRef(typeof window !== 'undefined' && window.innerWidth < 768);
  const frameCountRef = useRef(isMobileRef.current ? HERO_FRAME_COUNT_MOBILE : HERO_FRAME_COUNT);

  const framesRef = useRef<(HTMLImageElement | null)[]>(
    Array.from({ length: frameCountRef.current }, () => null),
  );
  const loadedRef = useRef<boolean[]>(
    Array.from({ length: frameCountRef.current }, () => false),
  );
  const currentFrameRef = useRef(0);
  const loadedCountRef = useRef(0);
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);
  const pendingFrameRef = useRef<number | null>(null);

  const [isSequenceReady, setIsSequenceReady] = useState(false);
  const { t } = useLang();

  // ── Canvas size sync ──────────────────────────────────────────────
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Cap DPR at 1 on mobile to halve canvas pixel count
    const maxDpr = isMobileRef.current ? 1 : 2;
    const dpr = clamp(window.devicePixelRatio || 1, 1, maxDpr);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvasSizeRef.current = { w, h };
    }
  }, []);

  // ── Draw a single frame ───────────────────────────────────────────
  const drawFrame = useCallback((frameIndex: number): boolean => {
    const canvas = canvasRef.current;
    const image = framesRef.current[frameIndex];
    if (!canvas || !image || !loadedRef.current[frameIndex]) return false;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    if (canvasSizeRef.current.w === 0 || canvasSizeRef.current.h === 0) {
      syncCanvasSize();
    }
    const { w, h } = canvasSizeRef.current;
    if (w === 0 || h === 0) return false;

    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.drawImage(image, dx, dy, dw, dh);
    return true;
  }, [syncCanvasSize]);

  // ── Nearest-frame fallback ────────────────────────────────────────
  const renderNearest = useCallback(
    (target: number) => {
      const bounded = clamp(target, 0, frameCountRef.current - 1);
      if (drawFrame(bounded)) return;
      for (let d = 1; d < frameCountRef.current; d++) {
        if (bounded - d >= 0 && drawFrame(bounded - d)) return;
        if (bounded + d < frameCountRef.current && drawFrame(bounded + d)) return;
      }
    },
    [drawFrame],
  );

  // ── Batched rAF draw ──────────────────────────────────────────────
  const scheduleRender = useCallback(
    (frameIndex: number) => {
      pendingFrameRef.current = frameIndex;
      if (rafRef.current !== null) return;
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
    const idleHandles: number[] = [];
    const timeoutHandles: ReturnType<typeof setTimeout>[] = [];

    const isMobile = isMobileRef.current;
    const frameCount = frameCountRef.current;
    const preloadCount = getEffectivePreloadCount();
    // On mobile, step through full 120-frame set to pick 60 evenly-spaced frames
    const step = isMobile ? Math.floor(HERO_FRAME_COUNT / frameCount) : 1;

    framesRef.current = Array.from({ length: frameCount }, () => null);
    loadedRef.current = Array.from({ length: frameCount }, () => false);
    loadedCountRef.current = 0;

    const loadFrame = (virtualIndex: number) => {
      const physicalIndex = isMobile
        ? getMobileFrameIndex(virtualIndex, HERO_FRAME_COUNT, frameCount)
        : virtualIndex;
      const img = new Image();
      img.decoding = 'async';
      img.src = getHeroFramePath(physicalIndex);

      img.onload = () => {
        if (cancelled) return;
        framesRef.current[virtualIndex] = img;
        loadedRef.current[virtualIndex] = true;
        loadedCountRef.current += 1;

        if (virtualIndex === 0) {
          // Defer to next paint so canvas has layout dimensions
          requestAnimationFrame(() => {
            if (cancelled) return;
            syncCanvasSize();
            setIsSequenceReady(true);
            scheduleRender(0);
          });
          return;
        }

        if (virtualIndex === currentFrameRef.current || loadedCountRef.current === 1) {
          scheduleRender(currentFrameRef.current);
        }
      };
    };

    for (let i = 0; i < Math.min(preloadCount, frameCount); i++) {
      loadFrame(i);
    }

    // Load remaining frames in small batches to avoid decode spikes. Desktop
    // used to queue every remaining frame at once, which landed ~100 decodes in
    // a single window; bound it the same way mobile is bound.
    const BATCH_SIZE = isMobile ? 4 : 12;
    let nextBatchStart = preloadCount;

    // requestIdleCallback alone is not enough to guarantee progress: while the
    // main thread is saturated it can be deferred well past its timeout, which
    // is how the sequence previously sat unloaded for seconds. Race it against a
    // timer so whichever comes first advances the batch, and let `scheduled`
    // collapse the duplicate.
    let scheduled = false;
    const scheduleNextBatch = (delay: number) => {
      if (cancelled || nextBatchStart >= frameCount) return;
      scheduled = true;
      const run = () => {
        if (!scheduled) return;
        scheduled = false;
        loadNextBatch();
      };
      if (typeof window.requestIdleCallback === 'function') {
        idleHandles.push(window.requestIdleCallback(run, { timeout: delay }));
      }
      timeoutHandles.push(setTimeout(run, delay));
    };

    const loadNextBatch = () => {
      if (cancelled || nextBatchStart >= frameCount) return;
      const end = Math.min(nextBatchStart + BATCH_SIZE, frameCount);
      for (let i = nextBatchStart; i < end; i++) {
        loadFrame(i);
      }
      nextBatchStart = end;
      scheduleNextBatch(100);
    };

    scheduleNextBatch(200);

    return () => {
      cancelled = true;
      if ('cancelIdleCallback' in window) {
        idleHandles.forEach((h) => window.cancelIdleCallback(h));
      }
      timeoutHandles.forEach(clearTimeout);
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
      renderNearest(currentFrameRef.current);
    });
    ro.observe(section);
    return () => ro.disconnect();
  }, [syncCanvasSize, renderNearest]);

  // ── hero-char-float — paused when hero scrolled out ──────────────
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => section.classList.toggle('hero-section-visible', entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // ── GSAP scroll scrub ─────────────────────────────────────────────
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || !isSequenceReady) return;

      // Registering here rather than at module scope keeps ScrollTrigger's
      // initial forced layout off the hydration critical path.
      ensureScrollTrigger();

      syncCanvasSize();

      const playhead = { frame: 0 };

      const tween = gsap.to(playhead, {
        frame: frameCountRef.current - 1,
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
          // Not '+=200vh': ScrollTrigger's offset parser only scales '%' by the
          // scroller size, so a 'vh' suffix falls through to parseFloat and is
          // read as 200 *pixels*. That crammed all 120 frames into 200px of
          // scroll — the sequence hit the last frame almost immediately and then
          // sat there. A function keeps the intent explicit and is re-evaluated
          // on refresh, which invalidateOnRefresh below already triggers.
          end: () => `+=${window.innerHeight * 2}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.3,
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
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: '#f4e7ec',
        backgroundImage: `url(${getHeroFramePath(0)})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          opacity: isSequenceReady ? 1 : 0,
          transition: 'opacity 0.5s ease',
          background: 'transparent',
        }}
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
    </section>
  );
}
