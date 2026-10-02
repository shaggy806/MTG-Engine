// A fixed pool of long-lived worker threads, each fed one job after another.
//
// `bot:ab` and `bot:diff` used to start a fresh worker for every game, and
// each one imported two whole builds (every card definition, twice) before
// playing a move — a few seconds of the CPU per game, and a heap torn down and
// rebuilt 400 times. Here each worker imports once and plays game after game.
//
// A job's worker posts any number of messages (`onMessage` sees each) and
// says it's finished with one `isFinal` accepts; it's then sent the next job.
// A job that runs past `timeoutMs`, or whose worker dies (an uncaught error,
// running out of its capped heap), is reported to `onLost` and its worker
// replaced, so one bad seed costs one worker, not the run.

import { Worker } from "node:worker_threads";

import { WORKER_LIMITS } from "./worker-limits.mjs";

export function runPool({
  url,
  workerData,
  jobs,
  workers,
  timeoutMs = Infinity,
  isFinal = () => true,
  onMessage,
  onLost,
  onDone,
}) {
  const queue = [...jobs];
  let live = 0;
  let finished = false;
  const finish = () => {
    if (finished || live > 0 || queue.length > 0) return;
    finished = true;
    onDone();
  };

  function spawn() {
    if (queue.length === 0) {
      finish();
      return;
    }
    live += 1;
    const worker = new Worker(url, { workerData, resourceLimits: WORKER_LIMITS });
    let job = null;
    let timer = null;
    let dead = false;
    const retire = () => {
      if (dead) return false;
      dead = true;
      clearTimeout(timer);
      live -= 1;
      return true;
    };
    const lose = (reason) => {
      const lost = job;
      if (!retire()) return;
      void worker.terminate();
      if (lost !== null) onLost(lost, reason);
      spawn();
    };
    const feed = () => {
      if (queue.length === 0) {
        retire();
        void worker.terminate();
        finish();
        return;
      }
      job = queue.shift();
      if (Number.isFinite(timeoutMs)) timer = setTimeout(() => lose("timeout"), timeoutMs);
      worker.postMessage(job);
    };
    worker.on("message", (message) => {
      if (dead) return;
      onMessage(message, job);
      if (isFinal(message)) {
        clearTimeout(timer);
        feed();
      }
    });
    worker.on("error", (error) => lose(String(error?.message ?? error)));
    worker.on("exit", () => lose("worker exited"));
    feed();
  }

  const start = Math.min(workers, queue.length);
  for (let i = 0; i < start; i += 1) spawn();
  finish();
}
