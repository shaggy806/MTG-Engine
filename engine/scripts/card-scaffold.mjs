#!/usr/bin/env node
// Writes card-file skeletons from the Oracle snapshot (`data/oracle/cards.jsonl`
// — see `gen-oracle.mjs`), so authoring starts from the real stat block, Oracle
// text and rulings instead of from memory, with no network needed.
//
// A skeleton goes to `src/cards/scaffold/` — outside `pool/` and `tokens/`, so
// `gen:cards` never registers it and nothing half-authored can reach a game
// (AUTHORING §0). Everything the snapshot can fill is filled: name, cost,
// colours, types, P/T, loyalty, faces and their layout flags, `text`, the
// keywords the engine models, a partner ability's `pairing`, and — for a
// token it makes — a match to an existing `tokens/` file or a token skeleton
// with its art pinned. Every other Oracle line is a `// TODO(scaffold):`
// comment where its ability goes, and the rulings sit in the header. To
// finish one: author the TODOs away, move the file into `pool/` (or
// `tokens/`), and run `gen:cards`. `cards/pool.test.ts` fails on a
// `TODO(scaffold)` left in the pool.
//
// A card whose Oracle text is *only* keywords the engine models (a vanilla or
// "French vanilla" creature) has nothing left to author, so it's written
// finished — "auto-finished" — but to `src/cards/review/`, not the pool.
// Nothing this script writes is registered: a person (or session) checks each
// file against its Oracle text and moves it into `pool/` or `tokens/`, and
// that move is the verification.
//
// Usage (after `npm run build -w engine`, which `card:scaffold` runs):
//   npm run card:scaffold -w engine -- "Card Name" ["Another" ...]
//   npm run card:scaffold -w engine -- --next 10            next unimplemented top-500 commanders
//   npm run card:scaffold -w engine -- --next 10 --cards    next unimplemented top-2000 cards
//   npm run card:scaffold -w engine -- --auto-scan          auto-finish (into review/) every keyword-only card
//                                                           in both backlog lists
//   npm run card:scaffold -w engine -- --auto-scan --all    …in the whole snapshot
//   --dry-run                                               print what would be written
//   npm run card:scaffold -w engine -- --report [--all]     write nothing: how much of the backlog
//                                                           (or the whole snapshot) the parser reads,
//                                                           and the unparsed lines that recur most

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { POOL_CARDS, TOKEN_CARDS } from "../dist/cards/generated.js";
import { parseFace, toSource } from "./oracle-parse.mjs";
import { findCard, loadSnapshot, suggest } from "./oracle-snapshot.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const cardsDir = path.join(here, "../src/cards");
const dirs = {
  scaffold: path.join(cardsDir, "scaffold"),
  // Finished, but unregistered until someone has checked them.
  review: path.join(cardsDir, "review"),
  // Beside the cards, not a level down: `../define.js` then resolves both here
  // and once the file has moved to tokens/.
  scaffoldTokens: path.join(cardsDir, "scaffold"),
};

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const reportMode = flag("--report");
const dryRun = flag("--dry-run") || reportMode;

if (loadSnapshot() === null) {
  console.error("No Oracle snapshot — run `npm run gen:oracle -w engine` first.");
  process.exit(1);
}

// ---------------------------------------------------------------- the pool

const poolNames = new Set(POOL_CARDS.map((c) => c.name));
const tokenNames = new Set(TOKEN_CARDS.map((c) => c.name));
const scaffolded = new Set(
  [dirs.scaffold, dirs.review]
    .filter(existsSync)
    .flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".ts")))
    .map((f) => f.replace(/\.ts$/, "")),
);

// ------------------------------------------------------------ text helpers

/** Kebab-case, accents and punctuation dropped — the pool's file names. */
const slug = (name) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const WUBRG = ["W", "U", "B", "R", "G"];
const orderColors = (colors = []) => WUBRG.filter((c) => colors.includes(c));
const SUPERTYPES = new Set(["legendary", "basic", "snow", "world"]);
const TYPES = new Set(["creature", "artifact", "enchantment", "land", "planeswalker", "instant", "sorcery", "battle"]);

/** "Legendary Artifact Creature — Dragon" → its three lists, and any word the
 * engine has no type for (Kindred). */
function parseTypeLine(typeLine) {
  const [left, right = ""] = typeLine.split(" — ");
  const supertypes = [];
  const types = [];
  const unknown = [];
  for (const word of left.split(" ").filter(Boolean)) {
    const w = word.toLowerCase();
    if (SUPERTYPES.has(w)) supertypes.push(w);
    else if (TYPES.has(w)) types.push(w);
    else if (w !== "token") unknown.push(word);
  }
  return { supertypes, types, subtypes: right.split(" ").filter(Boolean), unknown };
}

// ------------------------------------------------------- writing a file

/** A back face's own art: Scryfall serves the second face of a printing
 * under `/back/`. */
const backArt = (printing) =>
  `https://cards.scryfall.io/art_crop/back/${printing[0]}/${printing[1]}/${printing}.jpg`;

const BASIC_MANA = { Plains: "W", Island: "U", Swamp: "B", Mountain: "R", Forest: "G" };

/**
 * One face's file, from `parseFace` (oracle-parse.mjs). `face` is the snapshot
 * face (or the whole entry for a single-faced card); `ctx` carries the
 * card-level parts.
 */
function faceSource(face, ctx) {
  const t = parseTypeLine(face.type_line);
  const parsed = parseFace(face, { tokenFor: ctx.tokenFor });
  const notes = [];
  if (t.unknown.length > 0) notes.push(`type words the engine has no type for: ${t.unknown.join(", ")}`);
  const numeric = (v) => v === undefined || /^\d+$/.test(v);
  if (!numeric(face.power) || !numeric(face.toughness) || !numeric(face.loyalty)) {
    notes.push(
      `P/T ${face.power}/${face.toughness}${face.loyalty !== undefined ? `, loyalty ${face.loyalty}` : ""} ` +
        "isn't a plain number — a characteristic-defining ability, or an X",
    );
  }
  if (ctx.layoutNote) notes.push(ctx.layoutNote);

  // A basic land type means "{T}: Add [its colour]" (rule 305.6), which the
  // engine only has written out.
  const basics = t.subtypes.filter((s) => BASIC_MANA[s] !== undefined);
  if (t.types.includes("land") && basics.length > 0) {
    const colors = basics.map((s) => BASIC_MANA[s]);
    parsed.activated.unshift({
      cost: { mana: null, tap: true },
      targets: [],
      effect: colors.length === 1 ? { kind: "add-mana", mana: colors[0], amount: 1 } : { kind: "add-mana", mana: { oneOf: colors }, amount: 1 },
      resolve: null,
      text: `{T}: Add ${colors.map((c) => `{${c}}`).join(" or ")}.`,
    });
  }
  // An Aura targets what it enchants.
  if (parsed.enchant !== undefined) parsed.targets = [parsed.enchant];
  const done = parsed.complete && notes.length === 0 && (parsed.enchant !== undefined || t.subtypes.includes("Aura") === false);

  const num = (v) => (v === undefined ? undefined : /^\d+$/.test(v) ? Number(v) : 0);
  const def = {
    name: face.name,
    art: ctx.art,
    manaCost: face.mana_cost || undefined,
    colors: orderColors(face.colors ?? face.color_indicator ?? ctx.colors),
    supertypes: t.supertypes.length ? t.supertypes : undefined,
    types: t.types,
    subtypes: t.subtypes.length ? t.subtypes : undefined,
    power: num(face.power),
    toughness: num(face.toughness),
    loyalty: num(face.loyalty),
    keywords: parsed.keywords.length ? [...new Set(parsed.keywords)] : undefined,
    pairing: parsed.pairing,
    cantBeCountered: parsed.cantBeCountered,
    cycling: parsed.cycling,
    flashback: parsed.flashback,
    text: face.oracle_text ?? "",
    targets: parsed.targets?.length ? parsed.targets : undefined,
    effect: parsed.effect ?? undefined,
    castModal: parsed.castModal,
    activated: parsed.activated.length ? parsed.activated : undefined,
    triggered: parsed.triggered.length ? parsed.triggered : undefined,
    static: parsed.static.length ? parsed.static : undefined,
    faces: ctx.faces,
    ...(ctx.flag ? { [ctx.flag]: true } : {}),
  };
  const body = toSource(def).replace(/\n}$/, "");
  const todos = [
    ...notes,
    ...parsed.todo,
    ...(parsed.effectHints ?? []).map((h) => `(parsed "${h.sentence}" as ${JSON.stringify(h.effect)})`),
  ].map((n) => `  // TODO(scaffold): ${n}`);

  // The header speaks for the whole card: a face with nothing left to author
  // is still a scaffold while another face of it isn't done.
  const render = (cardDone) => {
    const header = [
      ...(cardDone
        ? [
            "// REVIEW — auto-finished by `npm run card:scaffold` from the Oracle snapshot: every line",
            "// of its text matched a template, so nothing was left to author. Not in the registry:",
            "// check it against the card's Oracle text, then move it into cards/pool/ (or tokens/)",
            "// and run `npm run gen:cards -w engine`.",
          ]
        : [
            "// SCAFFOLD — written by `npm run card:scaffold` from the Oracle snapshot. Not in the",
            "// registry: author each TODO(scaffold), move this file into cards/pool/ (or",
            "// tokens/), then run `npm run gen:cards -w engine`. See cards/AUTHORING.md.",
          ]),
      ...ctx.headerNotes.map((n) => `// ${n}`),
      ...(ctx.rulings.length > 0 && !cardDone
        ? ["//", "// Rulings:", ...ctx.rulings.flatMap((r) => wrap(`[${r.date}] ${r.text}`, "//   "))]
        : []),
    ];
    return (
      `import { defineCard } from "../define.js";\n\n${header.join("\n")}\n\n` +
      `export default defineCard(${body}${todos.length ? `\n${todos.join("\n")}` : ""}\n});\n`
    );
  };
  return { done, render, parsed };
}

/** Word-wrap a comment line at 100 columns. */
function wrap(text, prefix) {
  const out = [];
  let line = prefix;
  for (const word of text.split(" ")) {
    if (line.length + word.length + 1 > 100 && line.trim() !== prefix.trim()) {
      out.push(line.trimEnd());
      line = `${prefix}  `;
    }
    line += `${word} `;
  }
  out.push(line.trimEnd());
  return out;
}

const LAYOUT_FLAG = { transform: "transform", adventure: "adventure", modal_dfc: null };
const SUPPORTED_LAYOUTS = new Set(["normal", "transform", "modal_dfc", "adventure", "saga", "token"]);

// ------------------------------------------------------------------ tokens

/** Rules text compared loosely: reminder text dropped, and "this token" /
 * "this artifact" / "this creature" all read as "this" (our Treasure says
 * "Sacrifice this artifact", the printed token "this token"). */
const norm = (s) =>
  (s ?? "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\bthis (token|artifact|creature|enchantment|permanent)\b/gi, "this")
    .trim()
    .toLowerCase();

/** Scryfall's helper "tokens" that aren't a token a card makes: the Copy
 * placeholder, emblems, dungeons and the like. */
const isRealToken = (t) => t.name !== "Copy" && !/Emblem|Dungeon|Card/.test(t.type_line ?? "");

/** An existing `tokens/` definition this snapshot token is — same pinned
 * printing, or the same colours, types, P/T and rules text. */
function existingToken(t) {
  const tt = parseTypeLine(t.type_line ?? "");
  return TOKEN_CARDS.find((def) => {
    if (def.art === t.printing) return true;
    const sameList = (a, b) => [...a].sort().join() === [...b].sort().join();
    return (
      sameList(def.colors, orderColors(t.colors)) &&
      sameList(def.types, tt.types) &&
      sameList(def.subtypes, tt.subtypes) &&
      String(def.power ?? "") === String(t.power ?? "") &&
      String(def.toughness ?? "") === String(t.toughness ?? "") &&
      norm(def.text) === norm(t.oracle_text)
    );
  });
}

/** A name for a new token file that nothing uses yet. */
function newTokenName(t, cardName) {
  const base = `${t.name} Token`;
  return tokenNames.has(base) || poolNames.has(base) ? `${base} (${cardName})` : base;
}

// ------------------------------------------------------------ one card

const report = { scaffolded: [], autoFinished: [], skipped: [], tokens: [], parsed: [] };

function write(dir, file, source) {
  if (dryRun) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, file), source);
}

function scaffoldCard(name, { autoOnly = false, ignoreScaffolded = false } = {}) {
  const entry = findCard(name);
  if (entry === undefined) {
    const near = suggest(name);
    report.skipped.push(`${name}: not in the snapshot${near.length ? ` (did you mean ${near.join(", ")}?)` : ""}`);
    return;
  }
  const faces = entry.faces ?? [entry];
  if (faces.every((f) => poolNames.has(f.name))) {
    if (!autoOnly) report.skipped.push(`${entry.name}: already in the pool`);
    return;
  }
  if (!autoOnly && !ignoreScaffolded && faces.some((f) => scaffolded.has(slug(f.name)))) {
    report.skipped.push(`${entry.name}: already scaffolded`);
    return;
  }
  const multi = entry.faces !== undefined && ["transform", "modal_dfc", "adventure"].includes(entry.layout);
  const layoutNote = SUPPORTED_LAYOUTS.has(entry.layout) || multi ? null : `layout "${entry.layout}" isn't modeled`;

  // The tokens it makes, matched to ours or given a skeleton.
  const tokenNotes = [];
  const newTokens = [];
  const resolved = [];
  const amasses = faces.some((f) => /\bamass\b/i.test(f.oracle_text ?? ""));
  for (const t of (entry.tokens ?? []).filter(isRealToken)) {
    // Amass makes the engine's own "Army Token" and gives it the type.
    if (amasses && /\bArmy\b/.test(t.type_line ?? t.name)) {
      tokenNotes.push(`Makes ${t.name} by amassing → the engine's "Army Token".`);
      continue;
    }
    const have = existingToken(t);
    if (have) {
      tokenNotes.push(`Makes ${t.name} → use "${have.name}".`);
      resolved.push({ t, name: have.name });
      continue;
    }
    const tokenName = newTokenName(t, entry.name);
    resolved.push({ t, name: tokenName });
    tokenNotes.push(`Makes ${t.name} → new token "${tokenName}" (scaffolded).`);
    newTokens.push({ t, tokenName });
  }

  // "create a 1/1 white Spirit creature token with flying" → the token it
  // names: one of the card's own tokens with that name (and P/T, if given),
  // or one of the common named artifact tokens the pool already has.
  const tokenFor = (desc) => {
    const pt = /^(\d+)\/(\d+) /.exec(desc);
    const hit = resolved.find(
      ({ t }) =>
        ` ${desc} `.includes(` ${t.name} `) &&
        (pt === null || (String(t.power) === pt[1] && String(t.toughness) === pt[2])),
    );
    if (hit) return hit.name;
    const named = /^(Treasure|Food|Clue|Blood|Map|Gold|Powerstone|Junk|Incubator)$/.exec(desc);
    if (named && tokenNames.has(`${named[1]} Token`)) return `${named[1]} Token`;
    return null;
  };

  const results = faces.map((face, i) => ({
    face,
    ...faceSource(face, {
      tokenFor,
      colors: entry.colors,
      art: multi && i > 0 ? backArt(entry.printing) : undefined,
      faces: multi ? faces.map((f) => f.name) : undefined,
      flag: multi ? LAYOUT_FLAG[entry.layout] : undefined,
      layoutNote,
      rulings: i === 0 ? (entry.rulings ?? []) : [],
      headerNotes: [
        ...(i === 0 && entry.edhrec_rank ? [`EDHREC rank ${entry.edhrec_rank}.`] : []),
        ...(i === 0 ? tokenNotes : []),
      ],
    }),
  }));

  for (const r of results) report.parsed.push(r.parsed);

  // Auto-finish only when every face is done and no token needs work.
  const finished = results.every((r) => r.done) && newTokens.length === 0;
  if (autoOnly && !finished) return;
  for (const r of results) {
    if (poolNames.has(r.face.name)) continue;
    write(finished ? dirs.review : dirs.scaffold, `${slug(r.face.name)}.ts`, r.render(finished));
  }
  (finished ? report.autoFinished : report.scaffolded).push(entry.name);
  for (const { t, tokenName } of newTokens) {
    const res = faceSource({ ...t, name: tokenName }, {
      colors: t.colors,
      art: t.printing,
      rulings: [],
      headerNotes: [`${entry.name}'s ${t.name} token.`],
    });
    // A token waits beside the card that makes it — in review/ with a
    // finished card, otherwise in scaffold/ however complete it is.
    const ready = finished && res.done;
    write(ready ? dirs.review : dirs.scaffoldTokens, `${slug(tokenName)}.ts`, res.render(ready));
    tokenNames.add(tokenName);
    report.tokens.push(`${tokenName}${res.done ? " (complete — moves with its card)" : ""}`);
  }
}

// ------------------------------------------------------------------ main

/** Unimplemented names, in order, from a backlog list. */
function backlog(file) {
  return readFileSync(path.join(cardsDir, file), "utf8")
    .split("\n")
    .filter((l) => l.startsWith("[ ]"))
    .map((l) => l.replace(/^\[ \]\s+\d+\s+/, "").split(/\s{2,}/)[0]);
}

if (reportMode) {
  const names = flag("--all")
    ? loadSnapshot().entries.filter((e) => e.commander === "legal").map((e) => e.name)
    : [...new Set([...backlog("top-commanders.txt"), ...backlog("top-commander-cards.txt")])];
  for (const name of names) scaffoldCard(name, { autoOnly: false, ignoreScaffolded: true });
  printCoverage(names.length);
  process.exit(0);
} else if (flag("--auto-scan")) {
  const names = flag("--all")
    ? loadSnapshot().entries.filter((e) => e.commander === "legal").map((e) => e.name)
    : [...new Set([...backlog("top-commanders.txt"), ...backlog("top-commander-cards.txt")])];
  for (const name of names) scaffoldCard(name, { autoOnly: true });
} else if (option("--next") !== undefined) {
  const n = Number(option("--next"));
  const list = backlog(flag("--cards") ? "top-commander-cards.txt" : "top-commanders.txt");
  const todo = list.filter((name) => {
    const e = findCard(name);
    return e !== undefined && !(e.faces ?? [e]).some((f) => scaffolded.has(slug(f.name)));
  });
  for (const name of todo.slice(0, n)) scaffoldCard(name);
} else {
  const names = args.filter((a) => !a.startsWith("--") && a !== option("--next"));
  if (names.length === 0) {
    console.error('Usage: npm run card:scaffold -w engine -- "Card Name" … | --next N [--cards] | --auto-scan [--all] [--dry-run]');
    process.exit(1);
  }
  for (const name of names) scaffoldCard(name);
}

/** `--report`: the parser's reach over what was just (dry-)scaffolded. */
function printCoverage(total) {
  const pct = (a, b) => `${a}/${b} (${b ? ((100 * a) / b).toFixed(1) : 0}%)`;
  let abilities = 0;
  let finished = 0;
  let unreadLines = 0;
  const unparsed = new Map();
  const count = (line) => {
    // One template reads every number and every mana cost alike.
    const key = line.replace(/\b\d+\b/g, "N").replace(/\{[^}]+\}/g, "{…}");
    unparsed.set(key, (unparsed.get(key) ?? 0) + 1);
  };
  for (const p of report.parsed) {
    // An ability here had its cost or trigger read, whatever became of its
    // effect; a line read not at all is in `todo`.
    for (const a of [...p.activated, ...p.triggered]) {
      abilities += 1;
      if (a.effect !== null && a.__todo === undefined) finished += 1;
      for (const t of a.__todo ?? []) count(t);
    }
    unreadLines += p.todo.length;
    for (const t of p.todo) count(t);
  }
  const cards = report.autoFinished.length + report.scaffolded.length;
  console.log(`${total} names; ${cards} would be written (the rest are in the pool or not in the snapshot)`);
  console.log(`auto-finished (every line read): ${pct(report.autoFinished.length, cards)}`);
  console.log(`abilities with their cost or trigger read: ${abilities} (and ${unreadLines} other lines not read at all)`);
  console.log(`  …with the effect read too: ${pct(finished, abilities)}`);
  console.log("\nThe unparsed lines that recur most — the next templates to write:");
  for (const [line, n] of [...unparsed].sort((a, b) => b[1] - a[1]).slice(0, 40)) {
    console.log(`  ${String(n).padStart(4)}  ${line.length > 110 ? `${line.slice(0, 107)}…` : line}`);
  }
}

const show = (label, list) => {
  if (list.length > 0) console.log(`${label} (${list.length}):\n  ${list.join("\n  ")}`);
};
show(dryRun ? "Would auto-finish into review/" : "Auto-finished into review/", report.autoFinished);
show(dryRun ? "Would scaffold" : "Scaffolded into scaffold/", report.scaffolded);
show("Tokens", report.tokens);
show("Skipped", report.skipped);
if (!dryRun && report.autoFinished.length + report.scaffolded.length > 0) {
  console.log(
    "\nNothing was registered. Check each file against its Oracle text, move it into pool/ " +
      "(or tokens/), then run `npm run gen:cards -w engine`.",
  );
}
