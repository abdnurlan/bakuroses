/**
 * The hero glide's motion: one cubic Hermite per glide, so a glide can leave at whatever speed the page already has
 * (a fast scroll is carried on instead of braked, a turn-round keeps its momentum for a moment) and still arrive at
 * rest. Speeds are in units of the glide's average speed (distance / duration).
 */

/** seconds a glide takes over the whole film */
export const GLIDE_S = 2.2;
/** a glide nobody pushed (a dragged scrollbar left the film part-way) has no motion to carry on, so it takes longer */
export const SETTLE_S = 2.8;

/** speed a pushed glide leaves at when nothing faster is coming in */
export const PUSH = 1.3;
/** fastest a glide may leave at: beyond 3 a cubic Hermite overshoots its target */
export const MAX_LAUNCH = 3;
/** shortest glide, however hard the push */
export const MIN_GLIDE_S = 0.45;
/** how fast a turn-round may still be moving the old way, so it never swings far past where it turned */
const MAX_BACK = 1.5;

/** position (0..1) at time t (0..1) of a glide that leaves at speed v0 and arrives at v1 */
export function hermite(v0: number, v1 = 0): (t: number) => number {
  const a = v0 + v1 - 2;
  const b = 3 - 2 * v0 - v1;
  return (t) => ((a * t + b) * t + v0) * t;
}

/** speed of that glide at time t, in units of its average speed */
export function hermiteSlope(v0: number, v1 = 0): (t: number) => number {
  const a = v0 + v1 - 2;
  const b = 3 - 2 * v0 - v1;
  return (t) => (3 * a * t + 2 * b) * t + v0;
}

/** how far (0..1 of the distance) a glide leaving at v0 first runs the wrong way; 0 when it never does */
export function overshoot(v0: number, v1 = 0): number {
  const f = hermite(v0, v1);
  let low = 0;
  for (let i = 1; i <= 200; i++) low = Math.min(low, f(i / 200));
  return -low;
}

/**
 * A glide the visitor pushed carries their motion on at once and stops smoothly (a Hermite from speed PUSH to rest);
 * one from rest eases in and out.
 */
export function glideEase(pushed: boolean): (t: number) => number {
  return pushed ? hermite(PUSH) : (t) => (1 - Math.cos(t * Math.PI)) / 2;
}

export type GlidePlan = { duration: number; v0: number };

/** a glide over `distance` px taking at most `span` s, carrying on a scroll already moving at `speed` px/s */
export function planGlide(distance: number, span: number, speed: number): GlidePlan {
  if (distance <= 0 || span <= 0) return { duration: 0, v0: PUSH };
  if (speed <= (PUSH * distance) / span) return { duration: span, v0: PUSH };
  const duration = Math.min(span, Math.max(MIN_GLIDE_S, (MAX_LAUNCH * distance) / speed));
  return { duration, v0: Math.min(MAX_LAUNCH, Math.max(PUSH, (speed * duration) / distance)) };
}

/**
 * Turning a glide round: the page is moving the old way at `speed` px/s, so the new glide over `distance` px starts
 * by running on that way and comes back, like a scroll that is reversed. `room` px is how far it may run on before
 * it would leave the hero.
 */
export function planReverse(distance: number, span: number, speed: number, room: number): GlidePlan {
  const duration = Math.max(MIN_GLIDE_S, span);
  if (distance <= 0) return { duration: 0, v0: 0 };
  let v0 = -Math.min(MAX_BACK, (speed * duration) / distance);
  while (v0 < -0.01 && overshoot(v0) * distance > room) v0 *= 0.8;
  return { duration, v0: v0 < -0.01 ? v0 : 0 };
}
