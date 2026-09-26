/**
 * Guards the one-file-per-card layout: every `.ts` under `pool/` and `tokens/`
 * must default-export a `CardDefinition`, names must be unique, and the set on
 * disk must exactly match what `createDefaultRegistry()` builds — so adding a
 * card file without re-running `scripts/gen-cards.mjs` fails here rather than
 * silently shipping a card that no registry knows about.
 *
 * Also guards the pool/tokens split the codegen records as `POOL_CARDS` /
 * `TOKEN_CARDS`, since `isTokenCard` has no other way to tell the two apart,
 * and the second copy of the pool the codegen writes for web pages: the
 * shards, and the index of token names and pinned art beside them. The
 * codegen reads each card's name and art from its source text, so these are
 * where a card file it misread fails.
 */

import { describe, expect, it } from "vitest";
import { CARD_SHARD_COUNT, cardShardOf, loadCardShard } from "./card-shards.js";
import { isCardFront, isDeckableCard, isTokenCard } from "./classify.js";
import type { CardDefinition } from "./define.js";
import { POOL_CARDS, TOKEN_CARDS } from "./generated.js";
import { PINNED_ART, TOKEN_NAMES } from "./generated-index.js";
import { createDefaultRegistry } from "./registry.js";

const modules = import.meta.glob<{ default: CardDefinition }>(
  ["./pool/*.ts", "./tokens/*.ts"],
  { eager: true },
);

const files = Object.entries(modules).filter(([p]) => !p.endsWith(".test.ts"));

// The source text of the same files, for the scaffold guard below.
const sources = import.meta.glob<string>(["./pool/*.ts", "./tokens/*.ts"], {
  eager: true,
  query: "?raw",
  import: "default",
});

describe("card pool layout", () => {
  it("every file default-exports a uniquely-named CardDefinition", () => {
    const seen = new Set<string>();
    for (const [path, mod] of files) {
      const def = mod.default;
      expect(def, `${path} has no default export`).toBeDefined();
      expect(typeof def.name, `${path} default export is not a card`).toBe("string");
      expect(seen.has(def.name), `duplicate card name: ${def.name}`).toBe(false);
      seen.add(def.name);
    }
  });

  it("the registry contains exactly the cards on disk", () => {
    const onDisk = new Set(files.map(([, mod]) => mod.default.name));
    const registry = createDefaultRegistry();

    expect(registry.size).toBe(onDisk.size);
    for (const name of onDisk) {
      expect(
        registry.has(name),
        `${name} is on disk but not registered — run \`npm run gen:cards -w engine\``,
      ).toBe(true);
    }
  });

  it("POOL_CARDS / TOKEN_CARDS match the directories on disk", () => {
    const named = (sub: string) =>
      new Set(
        files.filter(([p]) => p.startsWith(`./${sub}/`)).map(([, mod]) => mod.default.name),
      );
    expect(new Set(POOL_CARDS.map((c) => c.name))).toEqual(named("pool"));
    expect(new Set(TOKEN_CARDS.map((c) => c.name))).toEqual(named("tokens"));
  });
});

describe("card shards", () => {
  const regenerate = "run `npm run gen:cards -w engine`";

  it("hold every card once, each in the shard its name hashes to", async () => {
    const shards = await Promise.all(
      Array.from({ length: CARD_SHARD_COUNT }, (_, i) => loadCardShard(i)),
    );
    const pool: CardDefinition[] = [];
    const tokens: CardDefinition[] = [];
    shards.forEach((shard, i) => {
      for (const def of [...shard.pool, ...shard.tokens]) {
        expect(
          cardShardOf(def.name),
          `${def.name} is in shard ${i}, so gen-cards.mjs misread its name — or ${regenerate}`,
        ).toBe(i);
      }
      pool.push(...shard.pool);
      tokens.push(...shard.tokens);
    });
    // The same definitions, not copies: a shard imports the card's own module.
    const byName = (defs: readonly CardDefinition[]) =>
      [...defs].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    expect(byName(pool), regenerate).toEqual(byName(POOL_CARDS));
    expect(byName(tokens), regenerate).toEqual(byName(TOKEN_CARDS));
    for (const [shard, all] of [
      [pool, POOL_CARDS],
      [tokens, TOKEN_CARDS],
    ] as const) {
      const sorted = byName(all);
      byName(shard).forEach((def, i) => expect(def).toBe(sorted[i]));
    }
  });

  it("an unknown name still names a shard", () => {
    const shard = cardShardOf("Not a Real Card");
    expect(Number.isInteger(shard) && shard >= 0 && shard < CARD_SHARD_COUNT).toBe(true);
  });

  it("the index's token names and pinned art are the definitions' own", () => {
    expect([...TOKEN_NAMES].sort(), regenerate).toEqual(TOKEN_CARDS.map((c) => c.name).sort());
    const pinned = Object.fromEntries(
      POOL_CARDS.flatMap((c) => (c.art === null ? [] : [[c.name, c.art]])),
    );
    expect(PINNED_ART, regenerate).toEqual(pinned);
  });
});

describe("card scaffolds", () => {
  // `npm run card:scaffold` writes a skeleton with a `TODO(scaffold)` per
  // Oracle line still to author, in cards/scaffold/, outside the registry.
  // One reaching pool/ or tokens/ with a TODO left would ship a card missing
  // an ability (AUTHORING §0).
  it("no pool or token file still has a TODO(scaffold)", () => {
    const unfinished = Object.entries(sources)
      .filter(([, text]) => text.includes("TODO(scaffold)"))
      .map(([path]) => path);
    expect(unfinished).toEqual([]);
  });
});

describe("deckbuilding flags", () => {
  // Rule 903.3a: a card that says it "can be your commander" is the only
  // way a planeswalker commands. `deck-validation.ts` reads the declarative
  // `canBeCommander`, never the text, so the two must agree.
  it("canBeCommander is set exactly on the cards that say they can be your commander", () => {
    const says = (def: CardDefinition): boolean => /can be your commander/i.test(def.text);
    const mismatched = POOL_CARDS.filter((def) => def.canBeCommander !== says(def)).map((d) => d.name);
    expect(mismatched).toEqual([]);
  });
});

describe("classify", () => {
  it("isTokenCard is the tokens/ directory, not a name guess", () => {
    for (const def of TOKEN_CARDS) expect(isTokenCard(def), def.name).toBe(true);
    for (const def of POOL_CARDS) expect(isTokenCard(def), def.name).toBe(false);
  });

  it("isCardFront picks the face a card is deck-listed under", () => {
    for (const def of POOL_CARDS) {
      if (def.faces === null) {
        expect(isCardFront(def), def.name).toBe(true);
      } else {
        expect(isCardFront(def), def.name).toBe(def.faces[0] === def.name);
      }
    }
  });

  it("isDeckableCard excludes tokens and back faces", () => {
    const deckable = POOL_CARDS.concat(TOKEN_CARDS).filter(isDeckableCard);
    expect(deckable.some((d) => isTokenCard(d))).toBe(false);
    expect(deckable.some((d) => !isCardFront(d))).toBe(false);
    // Sanity: the overwhelming majority of the pool is still deckable, so a
    // predicate that accidentally rejected everything would fail here. A
    // proportion, not a fixed count: every double-faced card adds a back face.
    expect(deckable.length).toBeGreaterThan(POOL_CARDS.length * 0.9);
  });
});
