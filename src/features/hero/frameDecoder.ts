// Fetches and decodes hero frames to ImageBitmaps inside a Web Worker, so the
// main thread never pays for image decoding while the visitor scrolls.
// Compressed blobs stay cached in the worker; decoded bitmaps are owned (and
// evicted) by the caller. The worker reports each frame as its bytes arrive, so
// callers only decode frames that are here — a stalled request never blocks the rest.
const WORKER = `
const urls = [];
const blobs = new Map();
const FETCH_TIMEOUT_MS = 8000;
function blob(i) {
  let p = blobs.get(i);
  if (!p) {
    const init = typeof AbortSignal !== "undefined" && AbortSignal.timeout
      ? { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
      : {};
    p = fetch(urls[i], init).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.blob();
    });
    blobs.set(i, p);
    // a failed or timed-out frame is dropped, so the next request for it retries
    p.then(() => self.postMessage({ type: "fetched", i }), () => blobs.delete(i));
  }
  return p;
}
self.onmessage = async (e) => {
  const m = e.data;
  if (m.type === "init") {
    urls.push(...m.urls);
    // two passes: the second retries whatever failed or timed out in the first
    const order = m.order.concat(m.order);
    let k = 0;
    const next = async () => {
      while (k < order.length) {
        const i = order[k++];
        try { await blob(i); } catch {}
      }
    };
    for (let c = 0; c < m.fetchers; c++) next();
    return;
  }
  if (m.type === "want") {
    // frames around the playhead jump the download queue
    for (const i of m.list) blob(i).catch(() => {});
    return;
  }
  if (m.type === "decode") {
    try {
      const bmp = await createImageBitmap(await blob(m.i));
      self.postMessage({ type: "decoded", i: m.i, bmp }, [bmp]);
    } catch {
      self.postMessage({ type: "decoded", i: m.i, bmp: null });
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
  private fetched = new Set<number>();
  private failures = 0;
  private disposed = false;

  constructor(
    private urls: readonly string[],
    order: readonly number[],
    fetchers: number,
    /** called each time another frame's bytes have arrived */
    private onFetched: () => void = () => {},
  ) {
    if (typeof Worker === 'undefined') return;
    try {
      this.script = URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }));
      this.worker = new Worker(this.script);
      this.worker.onmessage = (
        e: MessageEvent<{ type: 'fetched'; i: number } | { type: 'decoded'; i: number; bmp: ImageBitmap | null }>,
      ) => {
        const m = e.data;
        if (m.type === 'fetched') {
          this.fetched.add(m.i);
          this.onFetched();
        } else {
          this.settle(m.i, m.bmp);
        }
      };
      this.worker.onerror = () => this.fallback();
      this.worker.postMessage({ type: 'init', urls, order, fetchers });
    } catch {
      this.fallback();
    }
  }

  /** true once frame i can be decoded without waiting on the network */
  isFetched(i: number): boolean {
    // without a worker, decoding fetches the frame itself
    return !this.worker || this.fetched.has(i);
  }

  /** move these frames to the front of the download queue */
  prioritize(list: readonly number[]) {
    this.worker?.postMessage({ type: 'want', list });
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
