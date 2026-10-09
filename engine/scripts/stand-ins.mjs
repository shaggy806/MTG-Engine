#!/usr/bin/env node
// The sample decks' stand-ins: the `sub("Original", "Substitute", "why")`
// entries of `src/sample-decks.ts`'s substitution tables, each a card the
// engine can't run yet played by a reviewed substitute.
//
//   (no arguments) / --list   what's left, deck by deck, with each original's
//                             triage need keys (see needs-vocabulary.mjs)
//   --implemented             delete every stand-in whose original is now in
//                             the pool — what `sample-decks.test.ts` insists
//                             on — and print what was deleted
//   "Card Name" …             delete those stand-ins (they must exist)
//
// Either deletion also rewrites BACKLOG.md's count ("… precons' N stand-ins")
// to what's left, so the two can't drift. The file's line endings are kept.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { frontName, loadRecords, loadVocabulary, poolNames } from "./needs-vocabulary.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const DECKS = path.join(here, "../src/sample-decks.ts");
const BACKLOG = path.join(here, "../../BACKLOG.md");
const SUB = /^\s*sub\("((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)",/;

function read() {
  const text = readFileSync(DECKS, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(eol);
  const subs = [];
  let deck = "";
  lines.forEach((line, i) => {
    const d = /^ {4}name: "([^"]+)"/.exec(line);
    if (d) deck = d[1];
    const m = SUB.exec(line);
    if (m) subs.push({ line: i, deck, original: JSON.parse(`"${m[1]}"`), substitute: JSON.parse(`"${m[2]}"`) });
  });
  return { lines, eol, subs };
}

function updateBacklog(left) {
  const text = readFileSync(BACKLOG, "utf8");
  const next = text.replace(/(precons' )(\d+)( stand-ins)/, `$1${left}$3`);
  if (next !== text) writeFileSync(BACKLOG, next);
  return next !== text;
}

function remove(names) {
  const { lines, eol, subs } = read();
  const drop = new Set();
  for (const name of names) {
    const hit = subs.find((s) => s.original === name);
    if (hit === undefined) throw new Error(`no stand-in for "${name}" in sample-decks.ts`);
    drop.add(hit.line);
  }
  writeFileSync(DECKS, lines.filter((_l, i) => !drop.has(i)).join(eol));
  const left = subs.length - drop.size;
  const backlog = updateBacklog(left);
  console.log(`Removed ${drop.size}: ${names.join(", ")}. ${left} stand-ins left${backlog ? " (BACKLOG.md updated)" : ""}.`);
}

const args = process.argv.slice(2);
if (args.includes("--implemented")) {
  const pool = poolNames();
  const done = read()
    .subs.filter((s) => pool.has(s.original) || pool.has(frontName(s.original)))
    .map((s) => s.original);
  if (done.length === 0) console.log("No stand-in's original is in the pool yet.");
  else remove(done);
} else if (args.length > 0 && !args.includes("--list")) {
  remove(args);
} else {
  const vocab = loadVocabulary();
  const records = loadRecords();
  const { subs } = read();
  let deck = "";
  for (const s of subs) {
    if (s.deck !== deck) console.log(`\n${(deck = s.deck)}`);
    const needs = [
      ...new Set(
        records
          .filter((r) => frontName(r.name) === frontName(s.original))
          .flatMap((r) => r.needs.map((raw) => vocab.canonical(raw) ?? raw))
          .filter((k) => !vocab.isMeta(k)),
      ),
    ];
    console.log(`  ${s.original}  (for ${s.substitute})${needs.length ? `  — ${needs.join(", ")}` : ""}`);
  }
  console.log(`\n${subs.length} stand-ins.`);
}
