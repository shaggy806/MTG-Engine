#!/usr/bin/env node
// Everything a card or engine change must pass before it ships, in one
// command, in the order that fails fastest — the checks the `ship` skill
// lists, run for you. Node, not bash: a CRLF checkout breaks a shell script.
//
//   1. gen:cards (the card barrel and shards)
//   2. build (every workspace), then the backlog lists re-marked against it
//      and any sample-deck stand-in for a card now in the pool dropped
//   3. typecheck + lint, side by side
//   4. the engine suite (8 workers), then server + client side by side
//   5. new test files type-checked (vitest never type-checks a test, so a
//      wrong chooser signature or a cast can make one pass without testing);
//      modified ones are reported, not failed — 135 older files have errors
//   6. card:verify against the Oracle snapshot (offline)
//   7. side by side: the fuzzer at 2 and 4 players, the fuzzer with every
//      card this change adds (or `--with` names) forced in, the bot gate
//
// Steps 1-4 stop the run on failure (later results would mean nothing);
// 5-7 all run, and the exit code is 1 if anything failed. Logs go to the OS
// temp dir, one per step, named in the output.
//
// Usage: node scripts/verify.mjs [--with "Card Name"]... [--skip step,step]
//   steps for --skip: marks, lint, server, client, newtests, cardverify,
//   fuzz, fuzzwith, gate
//   --games N   2-player fuzz games (default 60; 4-player gets half)

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = path.join(ROOT, "engine");
const LOGS = os.tmpdir();

const args = process.argv.slice(2);
const withNames = [];
let skip = new Set();
let games = 60;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--with") withNames.push(args[++i]);
  else if (args[i] === "--skip") skip = new Set(args[++i].split(","));
  else if (args[i] === "--games") games = Number(args[++i]);
}

const failures = [];
const started = Date.now();
const secs = (t) => `${Math.round((Date.now() - t) / 1000)}s`;

/** Run `cmd args` (a shell only for npm/npx, whose Windows shims need one),
 * logging to a temp file. Resolves to { ok, log, out }. */
function run(name, cmd, cmdArgs, cwd = ROOT) {
  const log = path.join(LOGS, `verify-${name}.txt`);
  const t = Date.now();
  const useShell = cmd === "npm" || cmd === "npx";
  // A shell gets one command string (Node warns on args beside shell: true);
  // only npm/npx need it, and their arguments here are fixed, never a card name.
  const line = [cmd, ...cmdArgs.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a))].join(" ");
  return new Promise((resolve) => {
    const child = useShell
      ? spawn(line, { cwd, shell: true, env: process.env })
      : spawn(cmd, cmdArgs, { cwd, env: process.env });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => {
      writeFileSync(log, out);
      resolve({ name, ok: code === 0, log, out, time: secs(t) });
    });
  });
}

function report(r, summary = "") {
  console.log(`${r.ok ? "✓" : "✗"} ${r.name} (${r.time})${summary ? `  ${summary}` : ""}${r.ok ? "" : `  — log: ${r.log}`}`);
  if (!r.ok) {
    failures.push(r.name);
    console.log(r.out.split("\n").filter(Boolean).slice(-15).map((l) => `    ${l}`).join("\n"));
  }
}

const grab = (out, re) => out.split("\n").filter((l) => re.test(l)).map((l) => l.trim()).join("; ");

async function stopOnFailure(...results) {
  for (const r of results) report(r);
  if (results.some((r) => !r.ok)) {
    console.log(`\nStopped: ${failures.join(", ")} failed (${secs(started)}).`);
    process.exit(1);
  }
}

/** Pool cards this change adds: new files under engine/src/cards/pool. */
function addedCards() {
  const status = spawnSync("git", ["status", "--porcelain", "--", "engine/src/cards/pool"], { cwd: ROOT, encoding: "utf8" }).stdout;
  const names = [];
  for (const line of status.split("\n")) {
    if (!/^(\?\?|A )/.test(line)) continue;
    const file = path.join(ROOT, line.slice(3).trim());
    if (!file.endsWith(".ts") || !existsSync(file)) continue;
    const m = /^\s*name:\s*"((?:[^"\\]|\\.)*)"/m.exec(readFileSync(file, "utf8"));
    if (m) names.push(JSON.parse(`"${m[1]}"`));
  }
  return names;
}

/** Test files this change adds (`fresh`) or modifies, under engine/src. */
function changedTests() {
  const status = spawnSync("git", ["status", "--porcelain", "--", "engine/src"], { cwd: ROOT, encoding: "utf8" }).stdout;
  const fresh = [];
  const modified = [];
  for (const line of status.split("\n")) {
    const file = line.slice(3).trim();
    if (!/\.test\.ts$|\/test\/harness\.ts$/.test(file)) continue;
    (/^(\?\?|A )/.test(line) ? fresh : modified).push(path.relative("engine", file).replace(/\\/g, "/"));
  }
  return { fresh, modified };
}

async function typecheckTests() {
  const { fresh, modified } = changedTests();
  const files = [...fresh, ...modified];
  if (files.length === 0) return { name: "newtests", ok: true, log: "", out: "", time: "0s", summary: "no test files changed" };
  const config = path.join(ENGINE, "tsconfig.verify-tests.json");
  writeFileSync(
    config,
    JSON.stringify({ extends: "./tsconfig.json", compilerOptions: { noEmit: true }, include: files, exclude: [] }),
  );
  const r = await run("newtests", "npx", ["tsc", "-p", "tsconfig.verify-tests.json"], ENGINE);
  unlinkSync(config);
  const errors = r.out.split("\n").filter((l) => /error TS/.test(l));
  const inFresh = errors.filter((l) => fresh.some((f) => l.startsWith(f)));
  const inModified = errors.length - inFresh.length;
  const summary = `${fresh.length} new, ${modified.length} modified; ${inFresh.length} error(s) in new${inModified ? `, ${inModified} in modified (not failed — see log)` : ""}`;
  return { ...r, ok: inFresh.length === 0, summary };
}

// ------------------------------------------------------------------ run

const cards = [...new Set([...withNames, ...addedCards()])];
console.log(`verify: ${cards.length ? `new/forced cards: ${cards.join(", ")}` : "no new cards"}${skip.size ? `; skipping ${[...skip].join(", ")}` : ""}\n`);

await stopOnFailure(await run("gen:cards", "npm", ["run", "-s", "gen:cards", "-w", "engine"]));
await stopOnFailure(await run("build", "npm", ["run", "build"]));
if (!skip.has("marks")) {
  const marks = await Promise.all([
    run("cards:mark", "node", ["scripts/top-commander-cards.mjs", "--refresh"], ENGINE),
    run("cmdrs:mark", "node", ["scripts/top-commanders.mjs", "--refresh"], ENGINE),
  ]);
  for (const m of marks) report(m, grab(m.out, /implemented/));
  // A sample deck's stand-in for a card that's now in the pool goes (and
  // BACKLOG's count with it) — `sample-decks.test.ts` would fail on it.
  const subs = await run("stand-ins", "node", ["scripts/stand-ins.mjs", "--implemented"], ENGINE);
  report(subs, grab(subs.out, /Removed|No stand-in/));
}
await stopOnFailure(
  ...(await Promise.all([
    run("typecheck", "npm", ["run", "typecheck"]),
    ...(skip.has("lint") ? [] : [run("lint", "npm", ["run", "lint"])]),
  ])),
);

const engineTests = await run("engine tests", "npx", ["vitest", "run", "--maxWorkers=8"], ENGINE);
report(engineTests, grab(engineTests.out, /^\s*Tests\s/));
if (!engineTests.ok) {
  console.log(`\nStopped: engine tests failed (${secs(started)}).`);
  process.exit(1);
}
const others = await Promise.all([
  ...(skip.has("server") ? [] : [run("server tests", "npx", ["vitest", "run", "--maxWorkers=4"], path.join(ROOT, "server"))]),
  ...(skip.has("client") ? [] : [run("client tests", "npx", ["vitest", "run", "--maxWorkers=4"], path.join(ROOT, "client"))]),
]);
for (const r of others) report(r, grab(r.out, /^\s*Tests\s/));
if (others.some((r) => !r.ok)) {
  console.log(`\nStopped: ${failures.join(", ")} failed (${secs(started)}).`);
  process.exit(1);
}

if (!skip.has("newtests")) {
  const r = await typecheckTests();
  report(r, r.summary);
}
if (!skip.has("cardverify")) {
  const r = await run("card:verify", "node", ["scripts/verify-cards.mjs", "--offline"], ENGINE);
  report(r, grab(r.out, /checked,/));
}

const late = [];
if (!skip.has("fuzz")) {
  late.push(run("fuzz 2p", "node", ["scripts/random-demo.mjs", "--games", String(games)], ENGINE));
  late.push(run("fuzz 4p", "node", ["scripts/random-demo.mjs", "--games", String(Math.ceil(games / 2)), "--players", "4"], ENGINE));
}
if (!skip.has("fuzzwith") && cards.length > 0) {
  late.push(
    run("fuzz with new cards", "node", ["scripts/random-demo.mjs", "--games", "40", "--players", "4", ...cards.flatMap((c) => ["--with", c])], ENGINE),
  );
}
if (!skip.has("gate")) late.push(run("bot gate", "npm", ["run", "-s", "bot:scenarios", "-w", "engine"]));
for (const r of await Promise.all(late)) report(r, grab(r.out, /games —|avg turns|\d+\/\d+ passed/));

console.log(failures.length === 0 ? `\nAll green (${secs(started)}).` : `\nFailed: ${failures.join(", ")} (${secs(started)}).`);
process.exit(failures.length === 0 ? 0 : 1);
