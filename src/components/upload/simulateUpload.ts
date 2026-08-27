/**
 * Fakes network upload progress for each file id, calling onProgress on
 * every frame and onDone once every file reaches 100%. Returns a cancel
 * function to stop mid-flight (e.g. on unmount).
 */
export function simulateUpload(fileIds: string[], onProgress: (progress: Record<string, number>) => void, onDone: () => void): () => void {
  let cancelled = false;
  const start = performance.now();
  const durations = new Map(fileIds.map((id) => [id, 700 + Math.random() * 700]));

  function tick(now: number) {
    if (cancelled) return;
    const next: Record<string, number> = {};
    let allDone = true;
    for (const id of fileIds) {
      const duration = durations.get(id) ?? 900;
      const pct = Math.min(100, ((now - start) / duration) * 100);
      next[id] = pct;
      if (pct < 100) allDone = false;
    }
    onProgress(next);
    if (allDone) {
      window.setTimeout(() => {
        if (!cancelled) onDone();
      }, 250);
    } else {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
  return () => {
    cancelled = true;
  };
}
