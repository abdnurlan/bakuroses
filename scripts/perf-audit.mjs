/**
 * Scroll-performance audit for the storefront.
 *
 * "Freezing" on this site is a scroll-time compositing problem, not a load-time
 * one, so the headline number here is sustained FPS while wheeling through the
 * hero — measured under CPU throttling, because the jank only shows up on
 * hardware slower than a dev machine.
 *
 * Usage: node scripts/perf-audit.mjs [url] [--cpu N] [--headed]
 */
import { chromium } from '@playwright/test';

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000/az';
const cpuArgIndex = process.argv.indexOf('--cpu');
const cpuThrottle = cpuArgIndex !== -1 ? Number(process.argv[cpuArgIndex + 1]) : 4;
const headed = process.argv.includes('--headed');

const KB = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
const MB = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function bucket(request) {
  const type = request.resourceType();
  if (type === 'script') return 'js';
  if (type === 'stylesheet') return 'css';
  if (type === 'image') return 'image';
  if (type === 'font') return 'font';
  if (type === 'media') return 'media';
  if (type === 'xhr' || type === 'fetch') return 'xhr';
  return 'other';
}

const browser = await chromium.launch({ headless: !headed });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// ── Network accounting ────────────────────────────────────────────────
const transfer = {};
const counts = {};
const heroFrames = { count: 0, bytes: 0 };

page.on('response', async (response) => {
  const req = response.request();
  const key = bucket(req);
  let size = 0;
  try {
    size = Number((await response.headerValue('content-length')) ?? 0);
  } catch {
    /* response may already be gone */
  }
  transfer[key] = (transfer[key] ?? 0) + size;
  counts[key] = (counts[key] ?? 0) + 1;
  if (req.url().includes('/hero-frames/')) {
    heroFrames.count += 1;
    heroFrames.bytes += size;
  }
});

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

// ── Instrument before any app code runs ───────────────────────────────
await page.addInitScript(() => {
  window.__perf = { longTasks: [], lcp: 0, cls: 0, shifts: 0 };

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__perf.longTasks.push({ start: entry.startTime, duration: entry.duration });
    }
  }).observe({ type: 'longtask', buffered: true });

  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    window.__perf.lcp = entries[entries.length - 1].startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        window.__perf.cls += entry.value;
        window.__perf.shifts += 1;
      }
    }
  }).observe({ type: 'layout-shift', buffered: true });
});

const client = await context.newCDPSession(page);
await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle });

// ── Cold load ─────────────────────────────────────────────────────────
const t0 = Date.now();
await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
const loadWall = Date.now() - t0;

const nav = await page.evaluate(() => {
  const n = performance.getEntriesByType('navigation')[0];
  const paints = performance.getEntriesByType('paint');
  return {
    ttfb: n.responseStart,
    domContentLoaded: n.domContentLoadedEventEnd,
    load: n.loadEventEnd,
    fcp: paints.find((p) => p.name === 'first-contentful-paint')?.startTime ?? 0,
  };
});

// Let idle-time frame loading settle, which is when the decode storm happens.
await page.waitForTimeout(6000);

const afterIdle = await page.evaluate(() => ({
  ...window.__perf,
  heap: performance.memory?.usedJSHeapSize ?? 0,
  heapLimit: performance.memory?.jsHeapSizeLimit ?? 0,
  domNodes: document.getElementsByTagName('*').length,
}));

// ── Scroll FPS through the pinned hero ────────────────────────────────
// Real wheel events via CDP so Lenis's wheel hijacking is exercised the same
// way a user exercises it; window.scrollTo would bypass it entirely.
async function measureScroll(label, steps, deltaY) {
  await page.evaluate(() => {
    window.__frames = [];
    window.__scrollProbe = true;
    const tick = (t) => {
      if (!window.__scrollProbe) return;
      window.__frames.push(t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.mouse.move(720, 450);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(40);
  }

  const result = await page.evaluate(() => {
    window.__scrollProbe = false;
    const f = window.__frames;
    const deltas = [];
    for (let i = 1; i < f.length; i++) deltas.push(f[i] - f[i - 1]);
    deltas.sort((a, b) => a - b);
    const span = f.length > 1 ? f[f.length - 1] - f[0] : 0;
    const pick = (q) => deltas[Math.floor(deltas.length * q)] ?? 0;
    return {
      frames: f.length,
      span,
      fps: span > 0 ? ((f.length - 1) / span) * 1000 : 0,
      median: pick(0.5),
      p95: pick(0.95),
      worst: deltas[deltas.length - 1] ?? 0,
      // A "dropped frame" at 60Hz is any gap over ~2 vsyncs.
      janky: deltas.filter((d) => d > 33).length,
      frozen: deltas.filter((d) => d > 100).length,
      scrollY: window.scrollY,
    };
  });

  return { label, ...result };
}

const heroScroll = await measureScroll('hero (pinned canvas scrub)', 40, 120);
const pageScroll = await measureScroll('below hero (product grid → footer)', 40, 400);

const final = await page.evaluate(() => ({
  longTasks: window.__perf.longTasks.length,
  longTaskTime: window.__perf.longTasks.reduce((a, t) => a + t.duration, 0),
  worstTask: Math.max(0, ...window.__perf.longTasks.map((t) => t.duration)),
  heap: performance.memory?.usedJSHeapSize ?? 0,
  cls: window.__perf.cls,
  lcp: window.__perf.lcp,
  layers: document.querySelectorAll('*').length,
}));

// ── Report ────────────────────────────────────────────────────────────
const line = '─'.repeat(64);
console.log(`\n${line}`);
console.log(`PERF AUDIT  ${url}`);
console.log(`CPU throttle: ${cpuThrottle}x   viewport: 1440x900`);
console.log(line);

console.log('\nLOAD');
console.log(`  TTFB                ${nav.ttfb.toFixed(0)} ms`);
console.log(`  First Contentful    ${nav.fcp.toFixed(0)} ms`);
console.log(`  LCP                 ${final.lcp.toFixed(0)} ms`);
console.log(`  DOMContentLoaded    ${nav.domContentLoaded.toFixed(0)} ms`);
console.log(`  load event          ${nav.load.toFixed(0)} ms   (wall ${loadWall} ms)`);
console.log(`  CLS                 ${final.cls.toFixed(3)}`);

console.log('\nTRANSFER');
for (const key of Object.keys(transfer).sort((a, b) => transfer[b] - transfer[a])) {
  console.log(`  ${key.padEnd(8)} ${String(counts[key]).padStart(4)} req   ${KB(transfer[key]).padStart(10)}`);
}
const total = Object.values(transfer).reduce((a, b) => a + b, 0);
console.log(`  ${'TOTAL'.padEnd(8)} ${String(Object.values(counts).reduce((a, b) => a + b, 0)).padStart(4)} req   ${KB(total).padStart(10)}`);
console.log(`  hero-frames        ${String(heroFrames.count).padStart(4)} req   ${KB(heroFrames.bytes).padStart(10)}`);

console.log('\nMAIN THREAD');
console.log(`  long tasks          ${final.longTasks}  (total ${final.longTaskTime.toFixed(0)} ms, worst ${final.worstTask.toFixed(0)} ms)`);
console.log(`  JS heap after idle  ${MB(afterIdle.heap)}`);
console.log(`  JS heap at end      ${MB(final.heap)}  of ${MB(afterIdle.heapLimit)} limit`);
console.log(`  DOM nodes           ${afterIdle.domNodes}`);

console.log('\nSCROLL  (target: 60 fps / 16.7 ms frames)');
for (const s of [heroScroll, pageScroll]) {
  console.log(`\n  ${s.label}`);
  console.log(`    sustained fps     ${s.fps.toFixed(1)}`);
  console.log(`    frame time  med   ${s.median.toFixed(1)} ms   p95 ${s.p95.toFixed(1)} ms   worst ${s.worst.toFixed(0)} ms`);
  console.log(`    dropped (>33ms)   ${s.janky} of ${s.frames} frames`);
  console.log(`    stalls  (>100ms)  ${s.frozen}`);
  console.log(`    scrollY reached   ${s.scrollY}px`);
}

if (consoleErrors.length) {
  console.log('\nCONSOLE ERRORS');
  for (const e of [...new Set(consoleErrors)].slice(0, 10)) console.log(`  ${e.slice(0, 160)}`);
}
console.log(`\n${line}\n`);

await browser.close();
