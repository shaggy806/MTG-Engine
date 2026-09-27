// Two engine builds side by side, for comparing bots across commits
// (`bot-ab.mjs`, `bot-diff.mjs`): the engine as it was at a git ref, built
// from `git archive` into `.scratch/baseline/<sha>/` (git-ignored, inside the
// repo so the repo's own node_modules resolve for it), and a frozen copy of
// the current `engine/dist`, so rebuilding while a run is going doesn't pull
// the rug from under it. Controllers from two builds can share one table
// because `GameState` is plain data; a run is only meaningful while its shape
// hasn't changed between the two refs.

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRATCH = join(ROOT, ".scratch", "baseline");

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

/** The dist directory of the engine at `ref`, built once per commit. */
export function baselineDist(ref) {
  const sha = git("rev-parse", "--short", ref);
  const dir = join(SCRATCH, sha);
  const dist = join(dir, "engine", "dist");
  if (existsSync(join(dist, "index.js"))) return { sha, dist };
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  process.stderr.write(`building the engine at ${ref} (${sha}) into ${dir} ...\n`);
  const tar = execFileSync(
    "git",
    ["archive", "--format=tar", sha, "engine/src", "engine/tsconfig.json", "engine/package.json"],
    { cwd: ROOT, maxBuffer: 1 << 30 },
  );
  // From inside the directory: GNU tar reads a "C:" path as a remote host.
  execFileSync("tar", ["-x"], { cwd: dir, input: tar, maxBuffer: 1 << 30 });
  execFileSync(
    process.execPath,
    [join(ROOT, "node_modules", "typescript", "bin", "tsc"), "-p", join(dir, "engine")],
    { cwd: ROOT, stdio: "inherit" },
  );
  return { sha, dist };
}

/** A frozen copy of the current `engine/dist` (build it first). */
export function workingDist() {
  const source = join(ROOT, "engine", "dist");
  if (!existsSync(join(source, "index.js"))) throw new Error("no engine/dist — run `npm run build -w engine`");
  const dir = join(SCRATCH, `working-${Date.now()}`);
  mkdirSync(join(dir, "engine"), { recursive: true });
  cpSync(join(ROOT, "engine", "package.json"), join(dir, "engine", "package.json"));
  cpSync(source, join(dir, "engine", "dist"), { recursive: true });
  return { sha: "working", dist: join(dir, "engine", "dist") };
}

/** Import one build's barrel. */
export const importBuild = (dist) => import(pathToFileURL(join(dist, "index.js")).href);
