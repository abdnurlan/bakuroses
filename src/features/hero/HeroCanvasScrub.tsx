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

gsap.registerPlugin(ScrollTrigger);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function HeroCanvasScrub() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>(Array.from({ length: HERO_FRAME_COUNT }, () => null));
  const loadedFramesRef = useRef<boolean[]>(Array.from({ length: HERO_FRAME_COUNT }, () => false));
  const currentFrameRef = useRef(0);
  const loadedCountRef = useRef(0);

  const [isSequenceReady, setIsSequenceReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const image = framesRef.current[frameIndex];

    if (!canvas || !image || !loadedFramesRef.current[frameIndex]) {
      return false;
    }

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      return false;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, width, height);

    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    return true;
  }, []);

  const renderNearestAvailableFrame = useCallback((targetFrame: number) => {
    const boundedFrame = clamp(targetFrame, 0, HERO_FRAME_COUNT - 1);

    if (drawFrame(boundedFrame)) {
      return;
    }

    for (let distance = 1; distance < HERO_FRAME_COUNT; distance += 1) {
      const previousFrame = boundedFrame - distance;
      const nextFrame = boundedFrame + distance;

      if (previousFrame >= 0 && drawFrame(previousFrame)) {
        return;
      }

      if (nextFrame < HERO_FRAME_COUNT && drawFrame(nextFrame)) {
        return;
      }
    }
  }, [drawFrame]);

  useEffect(() => {
    let cancelled = false;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof window.setTimeout> | null = null;

    framesRef.current = Array.from({ length: HERO_FRAME_COUNT }, () => null);
    loadedFramesRef.current = Array.from({ length: HERO_FRAME_COUNT }, () => false);
    loadedCountRef.current = 0;

    const loadFrame = (index: number) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = getHeroFramePath(index);

      image.onload = () => {
        if (cancelled) {
          return;
        }

        framesRef.current[index] = image;
        loadedFramesRef.current[index] = true;
        loadedCountRef.current += 1;

        const progress = Math.round((loadedCountRef.current / HERO_FRAME_COUNT) * 100);
        setLoadProgress(progress);

        if (index === 0) {
          setIsSequenceReady(true);
        }

        if (index === currentFrameRef.current || loadedCountRef.current === 1) {
          renderNearestAvailableFrame(currentFrameRef.current);
        }
      };

      image.onerror = () => {
        if (!cancelled) {
          console.error(`[hero-sequence] failed to load frame ${index + 1}`);
        }
      };
    };

    for (let index = 0; index < Math.min(HERO_FRAME_PRELOAD_COUNT, HERO_FRAME_COUNT); index += 1) {
      loadFrame(index);
    }

    const loadRemainingFrames = () => {
      for (let index = HERO_FRAME_PRELOAD_COUNT; index < HERO_FRAME_COUNT; index += 1) {
        loadFrame(index);
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(loadRemainingFrames);
    } else {
      timeoutHandle = globalThis.setTimeout(loadRemainingFrames, 150);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        globalThis.clearTimeout(timeoutHandle);
      }
    };
  }, [renderNearestAvailableFrame]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const observer = new ResizeObserver(() => {
      renderNearestAvailableFrame(currentFrameRef.current);
    });

    observer.observe(section);
    return () => observer.disconnect();
  }, [renderNearestAvailableFrame]);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section || !isSequenceReady) {
        return;
      }

      const playhead = { frame: currentFrameRef.current };

      const scrubTween = gsap.to(playhead, {
        frame: HERO_FRAME_COUNT - 1,
        ease: 'none',
        duration: 1,
        onUpdate: () => {
          const nextFrame = Math.round(playhead.frame);
          currentFrameRef.current = nextFrame;
          renderNearestAvailableFrame(nextFrame);
        },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=100vh',
          pin: true,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      ScrollTrigger.refresh();

      return () => {
        scrubTween.scrollTrigger?.kill();
        scrubTween.kill();
      };
    },
    { scope: sectionRef, dependencies: [isSequenceReady, renderNearestAvailableFrame] }
  );

  return (
    <section ref={sectionRef} className="hero-video-shell">
      <div className="hero-video-backdrop" />

      <canvas
        ref={canvasRef}
        className={`hero-video-media ${isSequenceReady ? 'is-ready' : ''}`}
        aria-hidden="true"
      />

      <div className="hero-video-overlay" />

      <div className="hero-video-copy">
        <p className="hero-video-kicker">Baku Roses Gül Evi</p>
        <h1 className="hero-video-title">
          Zövqlə qurulan güllər,
          <br />
          kadr kimi təqdim olunur.
        </h1>
        <p className="hero-video-subtitle">
          Sakit jestlər, möhtəşəm qarşılamalar və gözəlliyi haqq edən məkanlar üçün əl ilə yığılmış buketlər.
        </p>
      </div>

      {!isSequenceReady && (
        <div className="hero-sequence-status">
          Kadrlar hazırlanır {loadProgress}%
        </div>
      )}
    </section>
  );
}
