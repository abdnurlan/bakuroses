'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
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

gsap.registerPlugin(ScrollTrigger);

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

    // Load remaining frames in small batches to avoid decode spikes
    const BATCH_SIZE = isMobile ? 4 : frameCount;
    let nextBatchStart = preloadCount;

    const loadNextBatch = () => {
      if (cancelled || nextBatchStart >= frameCount) return;
      const end = Math.min(nextBatchStart + BATCH_SIZE, frameCount);
      for (let i = nextBatchStart; i < end; i++) {
        loadFrame(i);
      }
      nextBatchStart = end;
      if (nextBatchStart < frameCount) {
        if (typeof window.requestIdleCallback === 'function') {
          idleHandles.push(window.requestIdleCallback(loadNextBatch, { timeout: 3000 }));
        } else {
          timeoutHandles.push(setTimeout(loadNextBatch, 100));
        }
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleHandles.push(window.requestIdleCallback(loadNextBatch, { timeout: 2000 }));
    } else {
      timeoutHandles.push(setTimeout(loadNextBatch, 200));
    }

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
          end: '+=200vh',
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
