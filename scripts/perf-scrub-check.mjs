/**
 * Verifies the hero scrub actually advances across the pin.
 *
 * The bug this guards against: `end: '+=200vh'` was parsed by ScrollTrigger as
 * 200 *pixels*, so all 120 frames were consumed within ~350px of scroll and the
 * canvas then sat frozen on the last frame for the rest of the pin. A healthy
 * sequence steps through many distinct frames spread over ~2 viewport heights.
 *
 * Usage: node scripts/perf-scrub-check.mjs [url]
 */
import { chromium } from '@playwright/test';

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000/az';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Record every frame index the canvas actually paints, keyed by scroll offset.
await page.addInitScript(() => {
  window.__frames = [];
  // Frames arrive as ImageBitmaps decoded in a worker (features/hero/frameDecoder.ts),
  // posted back as { i, bmp }: remember which frame each bitmap is.
  const bitmapFrame = new WeakMap();
  const NativeWorker = window.Worker;
  window.Worker = function (...args) {
    const worker = new NativeWorker(...args);
    worker.addEventListener('message', (e) => {
      if (e.data && e.data.bmp) bitmapFrame.set(e.data.bmp, e.data.i + 1);
    });
    return worker;
  };
  window.Worker.prototype = NativeWorker.prototype;
  const proto = CanvasRenderingContext2D.prototype;
  const original = proto.drawImage;
  proto.drawImage = function (image, ...rest) {
    let frame = bitmapFrame.get(image);
    if (!frame && image && image.src && image.src.includes('/hero-frames/')) {
      const m = image.src.match(/(\d+)\.webp/);
      if (m) frame = Number(m[1]);
    }
    if (frame) window.__frames.push({ frame, y: Math.round(window.scrollY) });
    return original.call(this, image, ...rest);
  };
});

await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
await page.waitForTimeout(4000);

for (let y = 0; y <= 2600; y += 100) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(260);
}

const r = await page.evaluate(() => {
  const f = window.__frames;
  const distinct = new Set(f.map((x) => x.frame));
  const drawn = f.filter((x) => x.y > 0);
  return {
    distinct: distinct.size,
    firstFrame: f.length ? f[0].frame : null,
    lastFrame: f.length ? f[f.length - 1].frame : null,
    // Scroll offset at which the sequence reaches its final frame. If this is
    // only a few hundred px, the '+=200vh' bug is back.
    reachedEndAt: drawn.find((x) => x.frame >= Math.max(...distinct)) ?.y ?? null,
    docHeight: document.documentElement.scrollHeight,
    samples: f.filter((_, i) => i % Math.max(1, Math.floor(f.length / 12)) === 0).map((x) => `${x.y}px:f${x.frame}`),
  };
});

console.log(`\n=== hero scrub check — ${url} ===\n`);
console.log(`  distinct frames drawn      ${r.distinct}`);
console.log(`  first → last frame         ${r.firstFrame} → ${r.lastFrame}`);
console.log(`  final frame reached at     ${r.reachedEndAt}px`);
console.log(`  document height            ${r.docHeight}px`);
console.log(`  trace                      ${r.samples.join('  ')}`);
console.log(
  `\n  ${r.distinct >= 30 && r.reachedEndAt > 1000 ? 'PASS — sequence spans the pin' : 'FAIL — sequence collapses early (the freeze)'}\n`,
);

await browser.close();
