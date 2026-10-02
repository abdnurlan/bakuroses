'use client';

import { useEffect, type RefObject } from 'react';
import { GLIDE_S, SETTLE_S, glideEase, hermite, hermiteSlope, planGlide, planReverse } from './glide';
import { releaseScroll, scrollToY } from '@/shared/lib/lenis';

/** the film's two resting places: below START it is at the opening, past END it has played out */
const START = 0.01;
const END = 0.98;
const CONTROLS = 'a, button, input, textarea, select, [contenteditable]';
const AWAY = "[data-lenis-prevent], [aria-modal='true']";
/** a scroll this soon after the visitor's own wheel, swipe or key is theirs: drifting into the hero, it is carried on */
const OWN_MS = 350;
/** wheel travel (px, within TURN_MS) against a glide that turns it round; less is jitter */
const TURN_PX = 24;
const TURN_MS = 150;
/** finger travel (px) against a glide that turns it round */
const TURN_TOUCH_PX = 12;
/** a boost needs the wheel or finger this much faster than the glide, and raises its speed at most BOOST_STEP times */
const BOOST = 1.25;
const BOOST_STEP = 1.6;
const BOOST_EVERY_MS = 100;
/** a fling down at least this fast (px/s) runs on into the page for CARRY_S of its speed instead of stopping dead */
const CARRY_SPEED = 2500;
const CARRY_S = 0.3;
const MAX_CARRY = 900;
/** shortest span a glide is planned over, so a nearly finished trip does not snap */
const MIN_SPAN = 0.6;

type Glide = { dir: 1 | -1; from: number; to: number; start: number; duration: number; slope: (t: number) => number; id: number };
type Sample = [time: number, value: number];

/**
 * The hero film rests only at its two ends. A wheel, swipe or scroll key inside the hero glides it to the other end,
 * leaving at the speed the page already has, so a fast scroll is carried on instead of braked. During a glide the
 * visitor stays in charge: input against it turns it round (it keeps its momentum for a moment, like a reversed
 * scroll), input with it speeds it up, and a hard fling down runs on into the page instead of stopping at the hero's
 * end. The visitor's own scroll drifting into the hero is carried on at once; anything else that leaves the film
 * part-way (a dragged scrollbar, find in page) settles once it lets go. Every glide is one Lenis scrollTo.
 */
export function useHeroGlide(
  sectionRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
  reduce: boolean,
) {
  useEffect(() => {
    const el = sectionRef.current;
    const stage = stageRef.current;
    if (!el || !stage || reduce) return;
    let glide: Glide | null = null;
    let ids = 0;
    let landed = 0;
    let settle = 0;
    let heading: 1 | -1 = 1;
    let ownUntil = 0;
    let ownKey = false;
    let boostedAt = 0;
    let touch: { y: number; lastY: number; lastT: number; back: number } | null = null;
    const moves: Sample[] = [];
    const wheel: Sample[] = [];

    const trim = (list: Sample[], now: number, ms: number) => {
      while (list.length && now - list[0][0] > ms) list.shift();
    };
    const sum = (list: Sample[], dir: 1 | -1, now: number, ms: number) =>
      list.reduce((n, [t, d]) => (now - t <= ms && Math.sign(d) === dir ? n + Math.abs(d) : n), 0);
    // the film plays while the sticky stage is pinned: from the section's top until its bottom meets the stage's
    const bounds = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      return { top, end: top + el.offsetHeight - stage.clientHeight };
    };
    const readProgress = () => {
      const b = bounds();
      return b.end > b.top ? Math.min(1, Math.max(0, (window.scrollY - b.top) / (b.end - b.top))) : 0;
    };
    let lastP = readProgress();
    const span = (seconds: number, distance: number, b: { top: number; end: number }) =>
      Math.max(MIN_SPAN, (seconds * distance) / Math.max(1, b.end - b.top));
    const stranded = (p: number) => p > START && p < END;
    const elsewhere = (e: Event) => !!(e.target as Element | null)?.closest?.(AWAY);
    const own = (now: number, key: boolean) => {
      ownUntil = now + OWN_MS;
      ownKey = key;
    };
    /** the page's own speed along `dir`, px/s */
    const pageSpeed = (dir: 1 | -1, now: number) => {
      trim(moves, now, 120);
      if (moves.length < 2) return 0;
      const [t0, y0] = moves[0];
      const [t1, y1] = moves[moves.length - 1];
      return t1 > t0 ? Math.max(0, (dir * (y1 - y0) * 1000) / (t1 - t0)) : 0;
    };
    /** the running glide's speed along its direction, px/s (below zero while a turn-round still runs the old way) */
    const glideSpeed = (g: Glide, now: number) =>
      (g.slope(Math.min(1, Math.max(0, (now - g.start) / (g.duration * 1000)))) * Math.abs(g.to - g.from)) / g.duration;

    const land = (id: number) => {
      if (glide?.id !== id) return;
      glide = null;
      window.clearTimeout(landed);
      // a resize during the glide can leave it short: finish the trip the way it was going
      if (stranded(readProgress())) begin(heading, false, 0);
    };
    const run = (dir: 1 | -1, to: number, duration: number, easing: (t: number) => number, slope: (t: number) => number) => {
      const id = ++ids;
      glide = { dir, from: window.scrollY, to, start: performance.now(), duration, slope, id };
      window.clearTimeout(settle);
      window.clearTimeout(landed);
      // locked: trackpad momentum must not cancel the glide; this hook still hears it, to turn or speed the glide
      scrollToY(to, { duration, easing, lock: true, onComplete: () => land(id) });
      landed = window.setTimeout(() => land(id), duration * 1000 + 250);
    };

    /** start a glide to the end `dir` points at; `pushed` carries on the page's `speed`, otherwise it eases from rest */
    const begin = (dir: 1 | -1, pushed: boolean, speed: number): boolean => {
      if (glide) return false;
      const p = readProgress();
      const b = bounds();
      const y = window.scrollY;
      // past the film's end only an upward push from the end itself glides back, not one from the page below
      if (dir > 0 ? p >= END : p <= START || (p >= END && y > b.end + 2)) return false;
      const to = dir > 0 ? b.end : b.top;
      const distance = Math.abs(to - y);
      if (distance < 1) return false;
      if (!pushed) {
        run(dir, to, span(SETTLE_S, distance, b), glideEase(false), (t) => (Math.PI / 2) * Math.sin(Math.PI * t));
        return true;
      }
      const plan = planGlide(distance, span(GLIDE_S, distance, b), speed);
      run(dir, to, plan.duration, hermite(plan.v0), hermiteSlope(plan.v0));
      return true;
    };
    const turn = (dir: 1 | -1, now: number) => {
      const g = glide;
      if (!g || g.dir === dir) return;
      const b = bounds();
      const y = window.scrollY;
      // turned while a fling's carry runs on into the page: give the page straight back to the wheel, like anywhere
      // else on the page, instead of gliding back up through the film
      if (dir < 0 && y > b.end + 2) {
        glide = null;
        window.clearTimeout(landed);
        releaseScroll();
        return;
      }
      const to = dir > 0 ? b.end : b.top;
      const distance = Math.abs(to - y);
      if (distance < 1) return;
      const room = Math.max(0, dir > 0 ? y - b.top : b.end - y);
      const plan = planReverse(distance, span(GLIDE_S, distance, b), Math.max(0, glideSpeed(g, now)), room);
      run(dir, to, plan.duration, hermite(plan.v0), hermiteSlope(plan.v0));
    };
    const boost = (rate: number, now: number) => {
      const g = glide;
      if (!g || now - boostedAt < BOOST_EVERY_MS || now - g.start < 60) return;
      const speed = glideSpeed(g, now);
      if (speed <= 0 || rate <= speed * BOOST) return;
      const b = bounds();
      const to = g.dir > 0 && rate >= CARRY_SPEED ? Math.max(g.to, b.end + Math.min(MAX_CARRY, rate * CARRY_S)) : g.to;
      const distance = Math.abs(to - window.scrollY);
      if (distance < 1) return;
      const plan = planGlide(distance, span(GLIDE_S, distance, b), Math.min(rate, speed * BOOST_STEP));
      boostedAt = now;
      run(g.dir, to, plan.duration, hermite(plan.v0), hermiteSlope(plan.v0));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
      const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if ((!down && !up) || (e.target as Element | null)?.closest?.(CONTROLS) || elsewhere(e)) return;
      const now = performance.now();
      own(now, true);
      if (!glide) {
        if (begin(down ? 1 : -1, true, 0)) e.preventDefault();
        return;
      }
      // during a glide a key's native jump would fight it: it turns the glide round or does nothing
      e.preventDefault();
      turn(down ? 1 : -1, now);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < 1 || Math.abs(e.deltaY) < Math.abs(e.deltaX) || elsewhere(e)) return;
      const now = performance.now();
      const dir = e.deltaY > 0 ? 1 : -1;
      own(now, false);
      wheel.push([now, e.deltaY]);
      trim(wheel, now, TURN_MS);
      if (!glide) {
        begin(dir, true, pageSpeed(dir, now));
        return;
      }
      if (dir !== glide.dir) {
        if (sum(wheel, dir, now, TURN_MS) >= TURN_PX) turn(dir, now);
        return;
      }
      boost((sum(wheel, dir, now, 120) * 1000) / 120, now);
    };
    const onTouchStart = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      touch = e.touches.length === 1 && y !== undefined && !elsewhere(e) ? { y, lastY: y, lastT: performance.now(), back: 0 } : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (!touch || y === undefined) return;
      const now = performance.now();
      const step = touch.lastY - y;
      const rate = (Math.abs(step) * 1000) / Math.max(1, now - touch.lastT);
      touch.lastY = y;
      touch.lastT = now;
      if (!glide) {
        if (Math.abs(touch.y - y) < 10) return;
        own(now, false);
        begin(touch.y > y ? 1 : -1, true, rate);
        return;
      }
      if (!step) return;
      own(now, false);
      const dir = step > 0 ? 1 : -1;
      if (dir !== glide.dir) {
        touch.back += Math.abs(step);
        if (touch.back >= TURN_TOUCH_PX) {
          touch.back = 0;
          turn(dir, now);
        }
        return;
      }
      touch.back = 0;
      boost(rate, now);
    };
    // the page's speed comes from every scroll; the film's progress sits still while the page below moves
    const onScroll = () => {
      const now = performance.now();
      moves.push([now, window.scrollY]);
      trim(moves, now, 120);
      const p = readProgress();
      if (p === lastP) return;
      heading = p > lastP ? 1 : -1;
      lastP = p;
      window.clearTimeout(settle);
      if (glide || !stranded(p)) return;
      if (now < ownUntil) begin(heading, true, ownKey ? 0 : pageSpeed(heading, now));
      else settle = window.setTimeout(() => begin(heading, false, 0), 400);
    };

    // capture phase: these run before Lenis can act on the same key, wheel or touch
    const opts = { capture: true, passive: true } as const;
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('wheel', onWheel, opts);
    window.addEventListener('touchstart', onTouchStart, opts);
    window.addEventListener('touchmove', onTouchMove, opts);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(landed);
      window.clearTimeout(settle);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('wheel', onWheel, opts);
      window.removeEventListener('touchstart', onTouchStart, opts);
      window.removeEventListener('touchmove', onTouchMove, opts);
      window.removeEventListener('scroll', onScroll);
    };
  }, [sectionRef, stageRef, reduce]);
}
