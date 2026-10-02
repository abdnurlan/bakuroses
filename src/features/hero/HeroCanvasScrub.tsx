'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  approach,
  canvasDensity,
  clamp01,
  coverRect,
  getHeroFramePath,
  nearestLoaded,
  REST_AFTER_MS,
  restGoal,
} from './heroFrameConfig';
import { useHeroFrames } from './useHeroFrames';
import { useLang } from '@/providers/LanguageProvider';

const PINK_WORD_RE = /güllər|flowers|цветы/i;

// How closely the film follows the scroll (ms time-constant); Lenis already smooths the wheel itself
const TAU_MS = 45;
// Crossfade resolution between neighbouring frames, so a slow scroll never steps
const BLEND_STEPS = 24;

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const reducedSnapshot = () => window.matchMedia(REDUCED_QUERY).matches;
const reducedServerSnapshot = () => false;

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

/**
 * Scroll-scrubbed frame sequence. The section is 300vh tall with a sticky 100vh
 * stage, so the film plays over 200vh of scroll with no pinning or layout work.
 * Frames are decoded off the main thread; the canvas follows the scroll with a
 * frame-rate independent ease and crossfades neighbouring frames.
 */
export function HeroCanvasScrub() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<() => void>(() => {});
  const reduce = useSyncExternalStore(subscribeReduced, reducedSnapshot, reducedServerSnapshot);
  const { variant, count, bitmapsRef, loadedRef, want } = useHeroFrames(!reduce, wakeRef);
  const { t } = useLang();

  // The pink letters float only while the hero is on screen
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

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!section || !stage || !canvas || !ctx) return;

    const last = count - 1;
    let stageH = stage.clientHeight;
    const readProgress = () => {
      const r = section.getBoundingClientRect();
      const span = r.height - stageH;
      return span > 0 ? clamp01(-r.top / span) : 0;
    };

    let current = readProgress() * last;
    let seen = current;
    let movedAt = -Infinity;
    let then = performance.now();
    let dir = 1;
    let drawn = -1;
    let raf = 0;
    let visible = true;

    const draw = (pos: number) => {
      const bitmaps = bitmapsRef.current;
      const loaded = loadedRef.current;
      let base = Math.floor(pos);
      let blend = Math.round((pos - base) * BLEND_STEPS);
      if (blend === BLEND_STEPS) {
        base = Math.min(base + 1, last);
        blend = 0;
      }
      const a = nearestLoaded(base, loaded);
      const bmpA = a >= 0 ? bitmaps[a] : null;
      if (!bmpA) return;
      const next = Math.min(base + 1, last);
      if (a !== base || next === base || !loaded[next]) blend = 0;
      const key = a * BLEND_STEPS + blend;
      if (key === drawn) return;
      const r = coverRect(canvas.width, canvas.height, bmpA.width, bmpA.height);
      ctx.globalAlpha = 1;
      ctx.drawImage(bmpA, r.x, r.y, r.w, r.h);
      const bmpB = blend > 0 ? bitmaps[next] : null;
      if (bmpB) {
        ctx.globalAlpha = blend / BLEND_STEPS;
        ctx.drawImage(bmpB, r.x, r.y, r.w, r.h);
        ctx.globalAlpha = 1;
      }
      if (drawn < 0) canvas.style.opacity = '1';
      drawn = key;
    };

    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(64, Math.max(0, now - then));
      then = now;
      const target = readProgress() * last;
      if (Math.abs(target - seen) > 1e-4) {
        dir = target > seen ? 1 : -1;
        seen = target;
        movedAt = now;
      }
      const idle = now - movedAt;
      const goal = restGoal(target, idle);
      current = approach(current, goal, dt, TAU_MS);
      if (Math.abs(goal - current) < 0.002) current = goal;
      want(current, dir);
      draw(current);
      // Sleep once the film has landed on a frame; scroll or a decoded frame wakes it
      if (current !== goal || idle < REST_AFTER_MS) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf || !visible) return;
      then = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      stageH = stage.clientHeight;
      const cw = canvas.clientWidth || 1;
      const ch = canvas.clientHeight || 1;
      const density = canvasDensity(cw, ch, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(cw * density));
      canvas.height = Math.max(1, Math.round(ch * density));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      // resizing clears the canvas: repaint now rather than show a blank frame
      drawn = -1;
      draw(current);
      wake();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    const ro = new ResizeObserver(resize);

    wakeRef.current = wake;
    resize();
    ro.observe(canvas);
    io.observe(section);
    window.addEventListener('scroll', wake, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', wake);
      wakeRef.current = () => {};
    };
  }, [variant, count, bitmapsRef, loadedRef, want]);

  return (
    <section ref={sectionRef} className="hero-scrub" aria-labelledby="hero-title">
      <div ref={stageRef} className="hero-scrub__stage">
        {/* Poster = frame 1: paints instantly and stays as the fallback (reduced motion, Save-Data) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-scrub__poster"
          src={getHeroFramePath(0)}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
        />
        {!reduce && <canvas ref={canvasRef} className="hero-scrub__canvas" aria-hidden="true" />}

        <div className="hero-video-overlay" />

        <div className="hero-video-copy">
          <p className="hero-video-kicker">{t('hero_kicker')}</p>
          <h1 id="hero-title" className="hero-video-title">
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
      </div>
    </section>
  );
}
