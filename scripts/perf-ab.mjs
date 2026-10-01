/**
 * A/B harness: re-measures the load+scroll cost with individual suspects
 * disabled via pre-hydration CSS/flags, to attribute the stall to a cause
 * before changing any source.
 *
 * Each variant is a style sheet injected before app code runs, so hydration —
 * where the 2.4s ScrollTrigger stall lives — sees the modified page.
 */
import { chromium } from '@playwright/test';

const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000/az';
const cpuArgIndex = process.argv.indexOf('--cpu');
const cpu = cpuArgIndex !== -1 ? Number(process.argv[cpuArgIndex + 1]) : 4;

const variants = {
  'A baseline': '',

  'B no grain (mix-blend-mode)': `.site-ambience__grain { display: none !important; }`,

  'C no backdrop-filter': `* { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`,

  'D no ambience layer at all': `.site-ambience { display: none !important; }`,

  'E no grain + no backdrop-filter': `
    .site-ambience__grain { display: none !important; }
    * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`,

  'F no infinite CSS animations': `
    .hero-title-pink__char, .final-cta-petal-1, .final-cta-petal-2,
    .final-cta-petal-3, .final-cta-glow, .about-thread { animation: none !important; }`,

  'G E + F combined': `
    .site-ambience__grain { display: none !important; }
    * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    .hero-title-pink__char, .final-cta-petal-1, .final-cta-petal-2,
    .final-cta-petal-3, .final-cta-glow, .about-thread { animation: none !important; }`,
};

async function run(label, css) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript((styleText) => {
    window.__perf = { longTasks: [] };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__perf.longTasks.push({ start: e.startTime, duration: e.duration });
      }
    }).observe({ type: 'longtask', buffered: true });

    if (styleText) {
      // documentElement exists before body during init scripts.
      const apply = () => {
        const s = document.createElement('style');
        s.textContent = styleText;
        document.documentElement.appendChild(s);
      };
      apply();
      document.addEventListener('DOMContentLoaded', apply);
    }
  }, css);

  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: cpu });

  await page.goto(base, { waitUntil: 'load', timeout: 120_000 });
  await page.waitForTimeout(7000);

  const load = await page.evaluate(() => ({
    tasks: window.__perf.longTasks.length,
    blocked: window.__perf.longTasks.reduce((a, t) => a + t.duration, 0),
    worst: Math.max(0, ...window.__perf.longTasks.map((t) => t.duration)),
  }));

  // Scroll FPS through the pinned hero.
  await page.evaluate(() => {
    window.__f = [];
    window.__on = true;
    const tick = (t) => {
      if (!window.__on) return;
      window.__f.push(t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.mouse.move(720, 450);
  for (let i = 0; i < 35; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(40);
  }
  const scroll = await page.evaluate(() => {
    window.__on = false;
    const f = window.__f;
    const d = [];
    for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]);
    const span = f.length > 1 ? f[f.length - 1] - f[0] : 0;
    d.sort((a, b) => a - b);
    return {
      fps: span > 0 ? ((f.length - 1) / span) * 1000 : 0,
      p95: d[Math.floor(d.length * 0.95)] ?? 0,
      dropped: d.filter((x) => x > 33).length,
      frames: f.length,
    };
  });

  await browser.close();
  return { label, ...load, ...scroll };
}

const results = [];
for (const [label, css] of Object.entries(variants)) {
  const r = await run(label, css);
  results.push(r);
  console.log(
    `${r.label.padEnd(32)} blocked ${r.blocked.toFixed(0).padStart(5)}ms  worst ${r.worst.toFixed(0).padStart(5)}ms  ` +
      `hero ${r.fps.toFixed(1).padStart(5)}fps  p95 ${r.p95.toFixed(0).padStart(3)}ms  dropped ${r.dropped}/${r.frames}`,
  );
}

const a = results[0];
console.log('\nDELTA vs baseline');
for (const r of results.slice(1)) {
  const blockedΔ = (((r.blocked - a.blocked) / a.blocked) * 100).toFixed(0);
  const fpsΔ = (r.fps - a.fps).toFixed(1);
  console.log(`  ${r.label.padEnd(32)} blocked ${blockedΔ.padStart(5)}%   hero fps ${fpsΔ > 0 ? '+' : ''}${fpsΔ}`);
}
console.log();
