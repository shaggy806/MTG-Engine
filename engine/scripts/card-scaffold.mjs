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

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { POOL_CARDS, TOKEN_CARDS } from "../dist/cards/generated.js";
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
const dryRun = flag("--dry-run");

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

/** Oracle keyword → the engine's `Keyword`. Anything else is authored by hand. */
const KEYWORDS = {
  flying: "flying",
  reach: "reach",
  haste: "haste",
  vigilance: "vigilance",
  defender: "defender",
  "first strike": "first-strike",
  "double strike": "double-strike",
  trample: "trample",
  deathtouch: "deathtouch",
  lifelink: "lifelink",
  menace: "menace",
  indestructible: "indestructible",
  hexproof: "hexproof",
  shroud: "shroud",
  flash: "flash",
  fear: "fear",
  intimidate: "intimidate",
  plainswalk: "plainswalk",
  islandwalk: "islandwalk",
  swampwalk: "swampwalk",
  mountainwalk: "mountainwalk",
  forestwalk: "forestwalk",
  desertwalk: "desertwalk",
};

const stripReminder = (line) => line.replace(/\s*\([^)]*\)/g, "").trim();

/**
 * What one Oracle line becomes, if the snapshot alone can say:
 * `{ keywords }` for a line of modeled keywords, `{ ward }` for a plain mana
 * or life ward, `{ pairing }` for a partner ability, `{ note }` for a line with
 * no behaviour of its own; `null` when it needs authoring.
 */
function classifyLine(rawLine, cardName) {
  const line = stripReminder(rawLine);
  if (line === "") return { note: "reminder text" };
  if (line === `${cardName} can be your commander.`) return { note: "commander eligibility" };
  let m;
  if (/^Partner$/.test(line)) return { pairing: { kind: "partner" } };
  if ((m = /^Partner with (.+)$/.exec(line))) return { pairing: { kind: "partner-with", name: m[1] } };
  if ((m = /^Partner—(.+)$/.exec(line))) return { pairing: { kind: "partner-group", group: m[1] } };
  if (/^Friends forever$/.test(line)) return { pairing: { kind: "partner-group", group: "Friends forever" } };
  if (/^Choose a Background$/.test(line)) return { pairing: { kind: "choose-a-background" } };
  if (/^Doctor's companion$/.test(line)) return { pairing: { kind: "doctors-companion" } };
  if ((m = /^Ward ((?:\{[0-9WUBRGC]+\})+)$/.exec(line))) return { ward: { mana: m[1] } };
  if ((m = /^Ward—Pay (\d+) life\.$/.exec(line))) return { ward: { payLife: Number(m[1]) } };
  const words = line.split(/,\s*|;\s*/).map((w) => w.toLowerCase());
  if (words.length > 0 && words.every((w) => KEYWORDS[w] !== undefined)) {
    return { keywords: words.map((w) => KEYWORDS[w]) };
  }
  return null;
}

// --------------------------------------------------------- writing a file

/** Pool-style source for one value: arrays and strings as a person writes them. */
const lit = (v) => (typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v).replace(/,/g, ", "));

const pairingLiteral = (p) =>
  p.kind === "partner-with"
    ? `{ kind: "partner-with", name: ${lit(p.name)} }`
    : p.kind === "partner-group"
      ? `{ kind: "partner-group", group: ${lit(p.group)} }`
      : `{ kind: "${p.kind}" }`;

/** A back face's own art: Scryfall serves the second face of a printing
 * under `/back/`. */
const backArt = (printing) =>
  `https://cards.scryfall.io/art_crop/back/${printing[0]}/${printing[1]}/${printing}.jpg`;

/**
 * One face's file. `face` is the snapshot face (or the whole entry for a
 * single-faced card); `ctx` carries the card-level parts.
 */
function faceSource(face, ctx) {
  const t = parseTypeLine(face.type_line);
  const lines = (face.oracle_text ?? "").split("\n").filter(Boolean);
  const keywords = [];
  const wards = [];
  const todos = [];
  let pairing = null;
  let usesPartnerWith = null;
  for (const line of lines) {
    const c = classifyLine(line, face.name);
    if (c === null) todos.push(line);
    else if (c.keywords) keywords.push(...c.keywords);
    else if (c.ward) wards.push(c.ward);
    else if (c.pairing) {
      pairing = c.pairing;
      if (c.pairing.kind === "partner-with") usesPartnerWith = c.pairing.name;
    }
  }
  const notes = [];
  if (t.unknown.length > 0) notes.push(`type words the engine has no type for: ${t.unknown.join(", ")}`);
  const numeric = (v) => v === undefined || /^\d+$/.test(v);
  if (!numeric(face.power) || !numeric(face.toughness) || !numeric(face.loyalty)) {
    notes.push(`P/T ${face.power}/${face.toughness}${face.loyalty !== undefined ? `, loyalty ${face.loyalty}` : ""} isn't a plain number — a characteristic-defining ability, or an X`);
  }
  if (ctx.layoutNote) notes.push(ctx.layoutNote);
  // A land's basic land types carry mana abilities the engine only has when
  // they're written out (rule 305.6), and its reminder text can hide one
  // (Dryad Arbor) — never finished automatically.
  if (t.types.includes("land")) notes.push("a land: write out its mana abilities (rule 305.6)");
  const done = todos.length === 0 && notes.length === 0;

  const imports = ['import { defineCard } from "../define.js";'];
  const helpers = [];
  if (wards.length > 0) helpers.push("ward");
  if (usesPartnerWith !== null) helpers.push("partnerWithTrigger");
  if (helpers.length > 0) imports.push(`import { ${helpers.join(", ")} } from "../helpers.js";`);

  const num = (v) => (v === undefined ? undefined : /^\d+$/.test(v) ? Number(v) : 0);
  const fields = [];
  fields.push(`  name: ${lit(face.name)},`);
  if (ctx.art) fields.push(`  art: ${lit(ctx.art)},`);
  if (face.mana_cost) fields.push(`  manaCost: ${lit(face.mana_cost)},`);
  fields.push(`  colors: ${lit(orderColors(face.colors ?? face.color_indicator ?? ctx.colors))},`);
  if (t.supertypes.length > 0) fields.push(`  supertypes: ${lit(t.supertypes)},`);
  fields.push(`  types: ${lit(t.types)},`);
  if (t.subtypes.length > 0) fields.push(`  subtypes: ${lit(t.subtypes)},`);
  if (face.power !== undefined) fields.push(`  power: ${num(face.power)},`, `  toughness: ${num(face.toughness)},`);
  if (face.loyalty !== undefined) fields.push(`  loyalty: ${num(face.loyalty)},`);
  if (keywords.length > 0) fields.push(`  keywords: ${lit([...new Set(keywords)])},`);
  if (pairing !== null) fields.push(`  pairing: ${pairingLiteral(pairing)},`);
  fields.push(`  text: ${lit(face.oracle_text ?? "")},`);
  const triggered = [
    ...(usesPartnerWith !== null ? [`partnerWithTrigger(${lit(usesPartnerWith)})`] : []),
    ...wards.map((w) => `ward(${w.mana ? `{ mana: ${lit(w.mana)} }` : `{ payLife: ${w.payLife} }`})`),
  ];
  if (triggered.length > 0) fields.push(`  triggered: [${triggered.join(", ")}],`);
  if (ctx.faces) fields.push(`  faces: ${lit(ctx.faces)},`);
  if (ctx.flag) fields.push(`  ${ctx.flag}: true,`);
  for (const n of notes) fields.push(`  // TODO(scaffold): ${n}`);
  for (const line of todos) fields.push(`  // TODO(scaffold): ${line}`);

  // The header speaks for the whole card: a face with nothing left to author
  // is still a scaffold while another face of it isn't done.
  const render = (cardDone) => {
    const header = [
    ...(cardDone
      ? [
          "// REVIEW — auto-finished by `npm run card:scaffold` from the Oracle snapshot: its text",
          "// is only keywords the engine models, so nothing was left to author. Not in the",
          "// registry: check it against the card's Oracle text, then move it into cards/pool/",
          "// (or tokens/) and run `npm run gen:cards -w engine`.",
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
    return `${imports.join("\n")}\n\n${header.join("\n")}\n\nexport default defineCard({\n${fields.join("\n")}\n});\n`;
  };
  return { done, render };
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

const report = { scaffolded: [], autoFinished: [], skipped: [], tokens: [] };

function write(dir, file, source) {
  if (dryRun) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, file), source);
}

function scaffoldCard(name, { autoOnly = false } = {}) {
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
  if (!autoOnly && faces.some((f) => scaffolded.has(slug(f.name)))) {
    report.skipped.push(`${entry.name}: already scaffolded`);
    return;
  }
  const multi = entry.faces !== undefined && ["transform", "modal_dfc", "adventure"].includes(entry.layout);
  const layoutNote = SUPPORTED_LAYOUTS.has(entry.layout) || multi ? null : `layout "${entry.layout}" isn't modeled`;

  // The tokens it makes, matched to ours or given a skeleton.
  const tokenNotes = [];
  const newTokens = [];
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
      continue;
    }
    const tokenName = newTokenName(t, entry.name);
    tokenNotes.push(`Makes ${t.name} → new token "${tokenName}" (scaffolded).`);
    newTokens.push({ t, tokenName });
  }

  const results = faces.map((face, i) => ({
    face,
    ...faceSource(face, {
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

if (flag("--auto-scan")) {
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
