/**
 * CPU sampling profile of the initial load, aggregated to self-time per
 * function and per script. Answers "what is actually burning the main thread"
 * instead of inferring it from timings.
 */
import { chromium } from '@playwright/test';

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000/az';
const cpuArgIndex = process.argv.indexOf('--cpu');
const cpuThrottle = cpuArgIndex !== -1 ? Number(process.argv[cpuArgIndex + 1]) : 4;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const client = await page.context().newCDPSession(page);

// Real decoded body sizes — content-length is absent on many dev-server
// responses, so Network.loadingFinished is the only trustworthy source.
const sizes = [];
await client.send('Network.enable');
const urlById = new Map();
client.on('Network.requestWillBeSent', (e) => urlById.set(e.requestId, e.request.url));
client.on('Network.loadingFinished', (e) => {
  sizes.push({ url: urlById.get(e.requestId) ?? '?', bytes: e.encodedDataLength });
});

await client.send('Profiler.enable');
await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle });
await client.send('Profiler.setSamplingInterval', { interval: 200 });
await client.send('Profiler.start');

await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
await page.waitForTimeout(5000);

const { profile } = await client.send('Profiler.stop');

// ── Aggregate self time ───────────────────────────────────────────────
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const selfTime = new Map();
for (let i = 0; i < profile.samples.length; i++) {
  const dt = profile.timeDeltas[i] ?? 0;
  selfTime.set(profile.samples[i], (selfTime.get(profile.samples[i]) ?? 0) + dt);
}

const fnTotals = [];
const scriptTotals = new Map();
for (const [id, us] of selfTime) {
  const node = byId.get(id);
  if (!node) continue;
  const { functionName, url: scriptUrl, lineNumber } = node.callFrame;
  const ms = us / 1000;
  fnTotals.push({
    name: functionName || '(anonymous)',
    url: scriptUrl ? scriptUrl.replace(/^https?:\/\/[^/]+/, '') : '(native)',
    line: lineNumber,
    ms,
  });
  const key = scriptUrl ? scriptUrl.replace(/^https?:\/\/[^/]+/, '') : '(native/gc)';
  scriptTotals.set(key, (scriptTotals.get(key) ?? 0) + ms);
}

fnTotals.sort((a, b) => b.ms - a.ms);
const totalMs = [...selfTime.values()].reduce((a, b) => a + b, 0) / 1000;

console.log(`\nCPU PROFILE  ${url}   (${cpuThrottle}x throttle)`);
console.log(`total sampled CPU: ${totalMs.toFixed(0)} ms\n`);

console.log('TOP FUNCTIONS BY SELF TIME');
for (const f of fnTotals.slice(0, 22)) {
  if (f.ms < 5) break;
  console.log(`  ${f.ms.toFixed(0).padStart(6)} ms  ${f.name.slice(0, 34).padEnd(34)} ${f.url.slice(-46)}:${f.line}`);
}

console.log('\nSELF TIME BY SCRIPT');
const scripts = [...scriptTotals.entries()].sort((a, b) => b[1] - a[1]);
for (const [script, ms] of scripts.slice(0, 16)) {
  if (ms < 5) break;
  console.log(`  ${ms.toFixed(0).padStart(6)} ms  ${script.slice(-70)}`);
}

// ── Payload ───────────────────────────────────────────────────────────
console.log('\nLARGEST RESOURCES (encoded)');
const interesting = sizes
  .filter((s) => !s.url.includes('/hero-frames/'))
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 14);
for (const s of interesting) {
  console.log(`  ${(s.bytes / 1024).toFixed(0).padStart(6)} KB  ${s.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 72)}`);
}

const group = (pred) => sizes.filter((s) => pred(s.url)).reduce((a, s) => a + s.bytes, 0);
console.log('\nPAYLOAD TOTALS (encoded)');
console.log(`  JS            ${(group((u) => u.includes('.js')) / 1024).toFixed(0).padStart(6)} KB`);
console.log(`  CSS           ${(group((u) => u.includes('.css')) / 1024).toFixed(0).padStart(6)} KB`);
console.log(`  hero frames   ${(group((u) => u.includes('/hero-frames/')) / 1024).toFixed(0).padStart(6)} KB`);
console.log(`  fonts         ${(group((u) => /\.(woff2?|ttf)/.test(u)) / 1024).toFixed(0).padStart(6)} KB`);
console.log(`  ALL           ${(sizes.reduce((a, s) => a + s.bytes, 0) / 1024).toFixed(0).padStart(6)} KB  (${sizes.length} requests)\n`);

await browser.close();
