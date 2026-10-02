// Fetches and decodes hero frames to ImageBitmaps inside a Web Worker, so the
// main thread never pays for image decoding while the visitor scrolls.
// Compressed blobs stay cached in the worker; decoded bitmaps are owned (and
// evicted) by the caller.
const WORKER = `
const urls = [];
const blobs = new Map();
function blob(i) {
  let p = blobs.get(i);
  if (!p) {
    p = fetch(urls[i]).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.blob();
    });
    blobs.set(i, p);
    p.catch(() => blobs.delete(i));
  }
  return p;
}
self.onmessage = async (e) => {
  const m = e.data;
  if (m.type === "init") {
    urls.push(...m.urls);
    let k = 0;
    const next = async () => {
      while (k < m.order.length) {
        const i = m.order[k++];
        try { await blob(i); } catch {}
      }
    };
    for (let c = 0; c < m.fetchers; c++) next();
    return;
  }
  if (m.type === "decode") {
    try {
      const bmp = await createImageBitmap(await blob(m.i));
      self.postMessage({ i: m.i, bmp }, [bmp]);
    } catch {
      self.postMessage({ i: m.i, bmp: null });
    }
  }
};
`;

const WORKER_FAILURES = 3;

export class FrameDecoder {
  private worker: Worker | null = null;
  private script = '';
  private waiting = new Map<number, (bmp: ImageBitmap | null) => void>();
  private pending = new Map<number, Promise<ImageBitmap | null>>();
  private failures = 0;
  private disposed = false;

  constructor(
    private urls: readonly string[],
    order: readonly number[],
    fetchers: number,
  ) {
    if (typeof Worker === 'undefined') return;
    try {
      this.script = URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }));
      this.worker = new Worker(this.script);
      this.worker.onmessage = (e: MessageEvent<{ i: number; bmp: ImageBitmap | null }>) =>
        this.settle(e.data.i, e.data.bmp);
      this.worker.onerror = () => this.fallback();
      this.worker.postMessage({ type: 'init', urls, order, fetchers });
    } catch {
      this.fallback();
    }
  }

  decode(i: number): Promise<ImageBitmap | null> {
    const known = this.pending.get(i);
    if (known) return known;
    const job = new Promise<ImageBitmap | null>((resolve) => {
      if (this.disposed) return resolve(null);
      if (!this.worker) return void this.local(i).then(resolve);
      this.waiting.set(i, resolve);
      this.worker.postMessage({ type: 'decode', i });
    }).finally(() => this.pending.delete(i));
    this.pending.set(i, job);
    return job;
  }

  dispose() {
    this.disposed = true;
    this.worker?.terminate();
    this.worker = null;
    if (this.script) URL.revokeObjectURL(this.script);
    for (const resolve of this.waiting.values()) resolve(null);
    this.waiting.clear();
  }

  private settle(i: number, bmp: ImageBitmap | null) {
    const resolve = this.waiting.get(i);
    this.waiting.delete(i);
    if (!resolve) return bmp?.close();
    if (bmp) return resolve(bmp);
    if (++this.failures >= WORKER_FAILURES) this.fallback();
    void this.local(i).then(resolve);
  }

  // Worker unavailable or failing: decode on the main thread instead
  private fallback() {
    this.worker?.terminate();
    this.worker = null;
    const stranded = [...this.waiting];
    this.waiting.clear();
    for (const [i, resolve] of stranded) void this.local(i).then(resolve);
  }

  private async local(i: number): Promise<ImageBitmap | null> {
    if (this.disposed) return null;
    try {
      const res = await fetch(this.urls[i]);
      if (!res.ok) return null;
      const bmp = await createImageBitmap(await res.blob());
      if (this.disposed) {
        bmp.close();
        return null;
      }
      return bmp;
    } catch {
      return null;
    }
  }
}
