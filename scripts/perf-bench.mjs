/**
 * Repeatable before/after benchmark, scoped to metrics that are not
 * network-bound.
 *
 * Earlier iterations of this script used `waitUntil: 'load'`, which waits on all
 * 120 hero frames and made LCP/load vary by >10s between runs for reasons that
 * had nothing to do with the code under test. So: navigate to DOMContentLoaded,
 * then observe a fixed 8s window of main-thread activity. Startup blocking is
 * what the hydration fix targets, and it is what this measures.
 *
 * Usage: node scripts/perf-bench.mjs [url] [--cpu N] [--runs N] [--label name]
 */
import { chromium } from '@playwright/test';

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000/az';
const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : dflt;
};
const cpu = Number(arg('--cpu', 4));
const runs = Number(arg('--runs', 5));
const label = arg('--label', 'current');
const WINDOW_MS = 8000;

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function once() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const client = await page.context().newCDPSession(page);

  await page.addInitScript(() => {
    window.__perf = { longTasks: [], lcp: 0, fcp: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__perf.longTasks.push({ start: e.startTime, duration: e.duration });
    }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => {
      const e = l.getEntries();
      window.__perf.lcp = e[e.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__perf.fcp = e.startTime;
    }).observe({ type: 'paint', buffered: true });
  });

  await client.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForTimeout(WINDOW_MS);

  const r = await page.evaluate((windowMs) => {
    const t = window.__perf.longTasks.filter((x) => x.start < windowMs);
    const heroReqs = performance
      .getEntriesByType('resource')
      .filter((x) => x.name.includes('/hero-frames/'))
      .sort((a, b) => a.responseEnd - b.responseEnd);
    return {
      fcp: window.__perf.fcp,
      lcp: window.__perf.lcp,
      blocked: t.reduce((a, x) => a + x.duration, 0),
      worst: Math.max(0, ...t.map((x) => x.duration)),
      tasks: t.length,
      quietAt: t.length ? Math.max(...t.map((x) => x.start + x.duration)) : 0,
      // How quickly the scrub sequence becomes usable, measured from the
      // network side: when did the 60th frame finish arriving?
      heroCount: heroReqs.length,
      hero60At: heroReqs[59]?.responseEnd ?? 0,
      firstHeroReqAt: heroReqs[0]?.startTime ?? 0,
    };
  }, WINDOW_MS);

  await browser.close();
  return r;
}

const all = [];
for (let i = 0; i < runs; i++) {
  process.stdout.write(`  run ${i + 1}/${runs}...\r`);
  all.push(await once());
}
const med = Object.fromEntries(Object.keys(all[0]).map((k) => [k, median(all.map((r) => r[k]))]));

console.log(`\n=== ${label} === median of ${runs} runs, ${cpu}x CPU throttle, ${WINDOW_MS / 1000}s window\n`);
const row = (n, v, u = 'ms') => console.log(`  ${n.padEnd(32)} ${String(v).padStart(8)} ${u}`);
row('First Contentful Paint', med.fcp.toFixed(0));
row('LCP', med.lcp.toFixed(0));
row('blocked (long tasks)', med.blocked.toFixed(0));
row('worst single task', med.worst.toFixed(0));
row('long task count', med.tasks.toFixed(0), '');
row('main thread quiet at', med.quietAt.toFixed(0));
console.log();
row('first hero frame requested', med.firstHeroReqAt.toFixed(0));
row('60 hero frames arrived by', med.hero60At.toFixed(0));
row('hero frames loaded in window', med.heroCount.toFixed(0), '');
console.log(`\nJSON ${JSON.stringify({ label, ...med })}\n`);
