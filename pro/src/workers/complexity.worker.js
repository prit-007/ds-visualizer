// Thin Web Worker wrapper around the pure benchmarks — keeps n-sweeps off
// the main thread so the page stays responsive while measuring.
/* eslint-disable no-restricted-globals -- `self` is the WorkerGlobalScope global; this file only ever runs inside a worker */
import { runBenchmark } from '../lib/complexity';

self.onmessage = (event) => {
  const { key, sizes } = event.data || {};
  try {
    self.postMessage({ ok: true, samples: runBenchmark(key, sizes) });
  } catch (error) {
    self.postMessage({ ok: false, error: String((error && error.message) || error) });
  }
};
