/**
 * Regenerates `src/cards/generated.ts` — the barrel that imports every card
 * file under `src/cards/pool/` and `src/cards/tokens/` and collects their
 * default exports into `BUILTIN_CARDS`.
 *
 * The two directories are also kept as their own exports (`POOL_CARDS` /
 * `TOKEN_CARDS`), because the directory is the only place that knows a
 * definition is a *token* rather than a card — nothing on `CardDefinition`
 * records it, and the old "the name contains 'Token'" guess was never
 * something a real card name couldn't trip. `cards/classify.ts` reads them.
 *
 * It also writes the pool out a second way, for web pages (see
 * `src/cards/card-shards.ts`, which says why):
 *   - `src/cards/shards/shard-NN.ts`, one module per shard, each holding the
 *     cards whose names hash to it;
 *   - `src/cards/shards/index.ts`, a dynamic `import()` per shard, which is
 *     what a bundler turns into one file per shard;
 *   - `src/cards/generated-index.ts`, what a page can know about the pool
 *     without loading any of it: which names are tokens, and the art a card
 *     (not a token) pins in place of Scryfall's default printing.
 * Those need each card's name and art, which are read from its source: a
 * helper's first argument (`painLand("Adarkar Wastes", …)`), or the `name:`
 * and `art:` of `defineCard({ … })`. `cards/pool.test.ts` checks what was
 * read against the real definitions, so a file written some other way fails
 * there rather than landing a card in a shard its name doesn't hash to.
 *
 * Run via `npm run gen:cards -w engine` (also wired as a `prebuild` step so a
 * fresh checkout always has up-to-date output). Every file it writes is
 * checked in so `tsc`, tests, and the demo scripts work without a generate
 * step, and each is only rewritten when its content changes.
 *
 * Deliberately dumb: one file = one card = one default export. A card's own
 * `.name` is the registry key; the filename only needs to be unique.
 */

import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const CARDS_DIR = fileURLToPath(new URL("../src/cards/", import.meta.url));
const OUT_FILE = path.join(CARDS_DIR, "generated.ts");
const INDEX_FILE = path.join(CARDS_DIR, "generated-index.ts");
const SHARDS_DIR = path.join(CARDS_DIR, "shards");
const SUBDIRS = ["pool", "tokens"];

/**
 * How many shards the pool is split into. More means a page looking up one
 * card fetches less; fewer means a page that needs every card (the library,
 * the deck builder) makes fewer requests. At ~5,500 definitions, 32 puts
 * about 60 kB of minified script in each.
 */
const SHARD_COUNT = 32;

/** FNV-1a over the name's UTF-16 code units — the same function as
 * `cardShardOf` in `src/cards/card-shards.ts`, which is what a page calls to
 * find a card's shard, so the two must agree. `pool.test.ts` checks they do. */
function shardOf(name) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % SHARD_COUNT;
}

/** `lightning-bolt` -> `_lightningBolt` (leading `_` dodges keywords / digits).
 * Any character that isn't a letter or digit (a comma, apostrophe, space in a
 * filename) is dropped after the `-`-to-camelCase pass, so a stray one can't
 * produce a broken identifier. The `.name` field, not the filename, is the
 * registry key — so this only needs to be unique, which `collect()` checks. */
function identifier(basename) {
  const camel = basename.replace(/[-_\s]+([a-z0-9])/gi, (_, c) => c.toUpperCase());
  return `_${camel.replace(/[^A-Za-z0-9]/g, "")}`;
}

/** A double-quoted string literal's body, and the text it spells. */
const STRING = String.raw`"((?:[^"\\]|\\.)*)"`;
const unescape = (body) =>
  body.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, c) =>
    c.length > 1 ? String.fromCharCode(parseInt(c.slice(1), 16)) : c,
  );

/**
 * The name and pinned art of the card a file default-exports, read from its
 * source. Two shapes, which between them are every file in the pool:
 * `export default helper("Name", …)` and `export default defineCard({ name:
 * "Name", …, art: "…" })` (or a `const` holding either, exported by name).
 */
function readCard(file, source) {
  let start = -1;
  const call = /export\s+default\s+[A-Za-z_$][\w$]*\s*\(/.exec(source);
  if (call) {
    start = call.index + call[0].length;
  } else {
    const ref = /export\s+default\s+([A-Za-z_$][\w$]*)\s*;/.exec(source);
    const decl =
      ref &&
      new RegExp(String.raw`\b(?:const|let)\s+${ref[1]}\b[^=]*=\s*[A-Za-z_$][\w$]*\s*\(`).exec(
        source,
      );
    if (decl) start = decl.index + decl[0].length;
  }
  const rest = start < 0 ? "" : source.slice(start);
  const named =
    new RegExp(String.raw`^\s*${STRING}`).exec(rest) ??
    new RegExp(String.raw`\bname:\s*${STRING}`).exec(rest);
  if (named === null) {
    throw new Error(
      `${file}: can't find the card's name. Default-export a call whose first argument is the ` +
        `name (\`helper("Name", …)\`) or \`defineCard({ name: "Name", … })\`, the two shapes ` +
        "gen-cards.mjs reads.",
    );
  }
  const art = new RegExp(String.raw`\bart:\s*${STRING}`).exec(rest);
  return { name: unescape(named[1]), art: art === null ? null : unescape(art[1]) };
}

function collect() {
  const bySub = new Map(SUBDIRS.map((sub) => [sub, []]));
  for (const sub of SUBDIRS) {
    const dir = path.join(CARDS_DIR, sub);
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .sort();
    for (const file of files) {
      const base = file.slice(0, -3);
      const card = readCard(`${sub}/${file}`, readFileSync(path.join(dir, file), "utf8"));
      bySub.get(sub).push({ id: identifier(`${sub}-${base}`), sub, base, ...card });
    }
  }
  return bySub;
}

const HEADER =
  "// AUTO-GENERATED by scripts/gen-cards.mjs — do not edit by hand.\n" +
  "// Run `npm run gen:cards -w engine` after adding or removing a card file.\n\n";

const list = (entries) => entries.map((e) => `  ${e.id},`).join("\n");

function renderBarrel(bySub) {
  const all = SUBDIRS.flatMap((sub) => bySub.get(sub));
  const imports = all.map((e) => `import ${e.id} from "./${e.sub}/${e.base}.js";`).join("\n");
  return (
    HEADER +
    'import type { CardDefinition } from "./define.js";\n\n' +
    `${imports}\n\n` +
    "/** Real Magic cards — every file under `pool/`. */\n" +
    `export const POOL_CARDS: readonly CardDefinition[] = [\n${list(bySub.get("pool"))}\n];\n\n` +
    "/** Token definitions — every file under `tokens/`. Registered like any\n" +
    " * other card (a `create-token` effect names one), but not a card: never\n" +
    " * deck-legal, and hidden from the card library by default. */\n" +
    `export const TOKEN_CARDS: readonly CardDefinition[] = [\n${list(bySub.get("tokens"))}\n];\n\n` +
    "/** The built-in card pool — every file under `pool/` and `tokens/`. */\n" +
    "export const BUILTIN_CARDS: readonly CardDefinition[] = [...POOL_CARDS, ...TOKEN_CARDS];\n"
  );
}

function renderIndex(bySub) {
  const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const tokens = [...bySub.get("tokens")].sort(byName);
  const pinned = bySub
    .get("pool")
    .filter((e) => e.art !== null)
    .sort(byName);
  return (
    HEADER +
    "/** The name of every definition under `tokens/`. The same set as\n" +
    " * `TOKEN_CARDS`, as bare names, so asking whether a definition is a token\n" +
    " * (`isTokenCard`) doesn't import every token to find out. */\n" +
    "export const TOKEN_NAMES: readonly string[] = [\n" +
    tokens.map((e) => `  ${JSON.stringify(e.name)},`).join("\n") +
    "\n];\n\n" +
    "/** Each card's own `art`, for the cards (`pool/`) that pin a printing, so\n" +
    " * a page can draw a card from its name alone (a deck's commander in the\n" +
    " * lobby) without loading its definition. A name missing here takes\n" +
    " * Scryfall's default printing. Tokens are left out: one is only ever drawn\n" +
    " * from its definition. */\n" +
    "export const PINNED_ART: Readonly<Partial<Record<string, string>>> = {\n" +
    pinned.map((e) => `  ${JSON.stringify(e.name)}: ${JSON.stringify(e.art)},`).join("\n") +
    "\n};\n"
  );
}

const shardFile = (i) => `shard-${String(i).padStart(2, "0")}`;

function renderShard(entries) {
  const imports = entries.map((e) => `import ${e.id} from "../${e.sub}/${e.base}.js";`).join("\n");
  const of = (sub) => {
    const ids = entries.filter((e) => e.sub === sub).map((e) => `    ${e.id},`);
    return ids.length === 0 ? "[]" : `[\n${ids.join("\n")}\n  ]`;
  };
  return (
    HEADER +
    'import type { CardShard } from "../card-shards.js";\n\n' +
    (imports.length > 0 ? `${imports}\n\n` : "") +
    `const shard: CardShard = {\n  pool: ${of("pool")},\n  tokens: ${of("tokens")},\n};\n\n` +
    "export default shard;\n"
  );
}

function renderShardLoaders() {
  const loaders = Array.from(
    { length: SHARD_COUNT },
    (_, i) => `  () => import("./${shardFile(i)}.js"),`,
  ).join("\n");
  return (
    HEADER +
    'import type { CardShard } from "../card-shards.js";\n\n' +
    "/** One loader per shard, in shard order. Each is a literal `import()` so a\n" +
    " * bundler can see every shard and give each its own file. */\n" +
    "export const SHARD_LOADERS: readonly (() => Promise<{ readonly default: CardShard }>)[] = [\n" +
    `${loaders}\n];\n`
  );
}

/** Writes `source` to `file` unless it already says exactly that. */
function write(file, source) {
  let existing = null;
  try {
    existing = readFileSync(file, "utf8");
  } catch {
    // Not written yet.
  }
  if (existing === source) return false;
  writeFileSync(file, source, "utf8");
  return true;
}

const collected = collect();
const count = SUBDIRS.reduce((n, sub) => n + collected.get(sub).length, 0);

const shards = Array.from({ length: SHARD_COUNT }, () => []);
for (const sub of SUBDIRS) {
  for (const entry of collected.get(sub)) shards[shardOf(entry.name)].push(entry);
}

mkdirSync(SHARDS_DIR, { recursive: true });
const outputs = [
  [OUT_FILE, renderBarrel(collected)],
  [INDEX_FILE, renderIndex(collected)],
  [path.join(SHARDS_DIR, "index.ts"), renderShardLoaders()],
  ...shards.map((entries, i) => [path.join(SHARDS_DIR, `${shardFile(i)}.ts`), renderShard(entries)]),
];
const written = outputs.filter(([file, source]) => write(file, source));

// A shard left over from a larger SHARD_COUNT would still compile, and ship.
const current = new Set(outputs.map(([file]) => path.basename(file)));
const stale = readdirSync(SHARDS_DIR).filter((f) => f.endsWith(".ts") && !current.has(f));
for (const f of stale) unlinkSync(path.join(SHARDS_DIR, f));

const changed = written.length + stale.length;
console.log(
  changed === 0
    ? `cards/generated.ts and ${SHARD_COUNT} shards already up to date (${count} cards)`
    : `wrote ${written.length} and removed ${stale.length} generated card files (${count} cards, ${SHARD_COUNT} shards)`,
);
