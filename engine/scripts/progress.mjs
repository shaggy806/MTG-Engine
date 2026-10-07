// A long job's progress, as a small JSON file other tools can watch.
//
// Each job writes `.claude/progress/<label>-<pid>.json` at the repo root:
// `{ label, done, total, failed, startedAt, updatedAt, finished, pid }`. The
// `job-progress` Claude Code mod polls that folder and draws one bar per job
// above the prompt, so a bench or fuzzer running in the background shows how
// far along it is without anyone tailing its log. Nothing reads these files
// otherwise: a job that never calls `progress()` is unaffected, and a failed
// write is ignored rather than allowed to break the run.
//
//   const bar = progress("bot:ab", 400);
//   bar.tick();           // one more done
//   bar.tick({ failed: true });
//   bar.finish();         // also called on process exit
//
// A process may run several bars, one after another (a tune's matches) or at
// once; each start gets its own file.

import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = fileURLToPath(new URL("../../.claude/progress/", import.meta.url));
/** At most this often to disk; the mod polls once a second. */
const WRITE_EVERY_MS = 500;
/** A finished job's file is swept by the next job after this long. */
const KEEP_FINISHED_MS = 60_000;
/** An unfinished job's file this old is a run that died without finishing. */
const KEEP_ABANDONED_MS = 24 * 60 * 60_000;

function sweep(now) {
  let names;
  try {
    names = readdirSync(DIR);
  } catch {
    return;
  }
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const path = join(DIR, name);
    try {
      const job = JSON.parse(readFileSync(path, "utf8"));
      const age = now - (job.updatedAt ?? statSync(path).mtimeMs);
      if (age > (job.finished ? KEEP_FINISHED_MS : KEEP_ABANDONED_MS)) rmSync(path, { force: true });
    } catch {
      // half-written by another job, or already gone
    }
  }
}

/** Every bar not yet finished, closed together when the process exits. */
const open = new Set();
let exitHooked = false;
let serial = 0;

/** `label` names the job on its bar (`bot:ab`, `fuzz 2p`); `total` is how many units it will do. */
export function progress(label, total) {
  const now = Date.now();
  const job = { label, done: 0, total, failed: 0, startedAt: now, updatedAt: now, finished: false, pid: process.pid };
  serial += 1;
  const file = join(DIR, `${label.replace(/[^\w.-]+/g, "_")}-${process.pid}-${serial}.json`);
  let lastWrite = 0;
  let pending = null;

  const write = () => {
    clearTimeout(pending);
    pending = null;
    lastWrite = Date.now();
    job.updatedAt = lastWrite;
    try {
      // Write then rename, so a reader never sees half a file.
      writeFileSync(`${file}.tmp`, JSON.stringify(job));
      renameSync(`${file}.tmp`, file);
    } catch {
      // the bar is a convenience; the run goes on without it
    }
  };
  const soon = () => {
    if (pending !== null) return;
    const wait = Math.max(0, lastWrite + WRITE_EVERY_MS - Date.now());
    pending = setTimeout(write, wait);
    pending.unref?.();
  };

  try {
    mkdirSync(DIR, { recursive: true });
  } catch {
    // as above
  }
  sweep(now);
  write();

  const finish = () => {
    if (job.finished) return;
    job.finished = true;
    open.delete(finish);
    write();
  };
  open.add(finish);
  if (!exitHooked) {
    exitHooked = true;
    process.once("exit", () => {
      for (const close of [...open]) close();
    });
  }

  return {
    tick({ failed = false, count = 1 } = {}) {
      job.done += count;
      if (failed) job.failed += count;
      soon();
    },
    finish,
  };
}

/** The running script's own name, for a default label (`bot-ab` for bot-ab.mjs). */
export function scriptLabel() {
  return basename(process.argv[1] ?? "job").replace(/\.m?js$/, "");
}
