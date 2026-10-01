/**
 * Renderer-stage breakdown during hero scroll: aggregates devtools.timeline
 * trace events so paint/style/layout/raster cost is attributed by stage rather
 * than lumped into the profiler's "(program)" bucket.
 *
 * Pass --gpu to run headed with GPU rasterization; headless SwiftShader inflates
 * raster cost, so compare both before blaming compositing.
 */
import { chromium } from '@playwright/test';

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000/az';
const cpuArgIndex = process.argv.indexOf('--cpu');
const cpu = cpuArgIndex !== -1 ? Number(process.argv[cpuArgIndex + 1]) : 4;
const useGpu = process.argv.includes('--gpu');

const browser = await chromium.launch({
  headless: !useGpu,
  args: useGpu ? ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] : [],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const client = await page.context().newCDPSession(page);

await client.send('Emulation.setCPUThrottlingRate', { rate: cpu });
await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
await page.waitForTimeout(10_000);

const events = [];
client.on('Tracing.dataCollected', (e) => events.push(...e.value));

await client.send('Tracing.start', {
  traceConfig: {
    includedCategories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame',
    ],
  },
  transferMode: 'ReportEvents',
});

await page.mouse.move(720, 450);
for (let i = 0; i < 40; i++) {
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(40);
}

await new Promise((resolve) => {
  client.once('Tracing.tracingComplete', resolve);
  client.send('Tracing.end');
});

// ── Aggregate complete ("X") events by stage ──────────────────────────
const INTERESTING = new Set([
  'UpdateLayoutTree', // style recalculation
  'Layout',
  'Paint',
  'PaintImage',
  'RasterTask',
  'Rasterize',
  'CompositeLayers',
  'Commit',
  'DecodeImage',
  'ImageDecodeTask',
  'FunctionCall',
  'TimerFire',
  'EventDispatch',
  'HitTest',
  'PrePaint',
  'Layerize',
  'ScrollLayer',
  'UpdateLayer',
  'UpdateLayerTree',
]);

const byName = new Map();
let traceSpanStart = Infinity;
let traceSpanEnd = 0;

for (const e of events) {
  if (e.ph !== 'X' && e.ph !== 'b') continue;
  if (typeof e.ts === 'number') {
    traceSpanStart = Math.min(traceSpanStart, e.ts);
    traceSpanEnd = Math.max(traceSpanEnd, e.ts + (e.dur ?? 0));
  }
  if (!INTERESTING.has(e.name)) continue;
  const rec = byName.get(e.name) ?? { count: 0, ms: 0, max: 0 };
  const ms = (e.dur ?? 0) / 1000;
  rec.count += 1;
  rec.ms += ms;
  rec.max = Math.max(rec.max, ms);
  byName.set(e.name, rec);
}

const wall = (traceSpanEnd - traceSpanStart) / 1000;

console.log(`\nRENDERER STAGE BREAKDOWN DURING HERO SCROLL`);
console.log(`mode: ${useGpu ? 'headed + GPU rasterization' : 'headless (software raster)'}   cpu throttle: ${cpu}x`);
console.log(`trace wall time: ${wall.toFixed(0)} ms\n`);

const rows = [...byName.entries()].sort((a, b) => b[1].ms - a[1].ms);
console.log(`  ${'stage'.padEnd(20)} ${'count'.padStart(6)} ${'total ms'.padStart(10)} ${'max ms'.padStart(8)} ${'% wall'.padStart(7)}`);
for (const [name, r] of rows) {
  if (r.ms < 1) continue;
  console.log(
    `  ${name.padEnd(20)} ${String(r.count).padStart(6)} ${r.ms.toFixed(0).padStart(10)} ${r.max.toFixed(1).padStart(8)} ${((r.ms / wall) * 100).toFixed(1).padStart(7)}`,
  );
}

// Frame cadence from the frame category.
const frames = events.filter((e) => e.name === 'DrawFrame' || e.name === 'DroppedFrame');
const drawn = frames.filter((e) => e.name === 'DrawFrame').length;
const dropped = frames.filter((e) => e.name === 'DroppedFrame').length;
console.log(`\n  frames drawn ${drawn}   dropped ${dropped}   effective fps ${wall > 0 ? ((drawn / wall) * 1000).toFixed(1) : 'n/a'}`);
console.log();

await browser.close();
