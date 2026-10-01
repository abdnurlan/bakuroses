/**
 * Prints the caller chain for the hottest profile nodes during load, so a
 * minified hot function can be attributed to a real call site.
 */
import { chromium } from '@playwright/test';

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000/az';
const cpuArgIndex = process.argv.indexOf('--cpu');
const cpu = cpuArgIndex !== -1 ? Number(process.argv[cpuArgIndex + 1]) : 4;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const client = await page.context().newCDPSession(page);

await client.send('Profiler.enable');
await client.send('Emulation.setCPUThrottlingRate', { rate: cpu });
await client.send('Profiler.setSamplingInterval', { interval: 150 });
await client.send('Profiler.start');
await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
await page.waitForTimeout(5000);
const { profile } = await client.send('Profiler.stop');

const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const parent = new Map();
for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);

const self = new Map();
for (let i = 0; i < profile.samples.length; i++) {
  self.set(profile.samples[i], (self.get(profile.samples[i]) ?? 0) + (profile.timeDeltas[i] ?? 0));
}

// Total time = self + all descendants, so a wrapper's true cost is visible.
const total = new Map();
for (const [id, us] of self) {
  let cur = id;
  const seen = new Set();
  while (cur !== undefined && !seen.has(cur)) {
    seen.add(cur);
    total.set(cur, (total.get(cur) ?? 0) + us);
    cur = parent.get(cur);
  }
}

const label = (id) => {
  const n = byId.get(id);
  if (!n) return '?';
  const f = n.callFrame;
  const file = (f.url || '(native)').replace(/^https?:\/\/[^/]+\//, '');
  return `${f.functionName || '(anon)'}  [${file}:${f.lineNumber}:${f.columnNumber}]`;
};

const hot = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

console.log(`\nCALLER CHAINS FOR HOTTEST NODES  (${cpu}x throttle)\n`);
for (const [id, us] of hot) {
  console.log(`━━ self ${(us / 1000).toFixed(0)} ms | total ${((total.get(id) ?? 0) / 1000).toFixed(0)} ms`);
  const chain = [];
  let cur = id;
  const seen = new Set();
  while (cur !== undefined && !seen.has(cur)) {
    seen.add(cur);
    chain.push(cur);
    cur = parent.get(cur);
  }
  chain.reverse();
  chain.forEach((nid, depth) => {
    console.log(`${'  '.repeat(depth + 1)}${depth === chain.length - 1 ? '→ ' : ''}${label(nid)}`);
  });
  console.log();
}

await browser.close();
