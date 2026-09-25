/**
 * The card pool in shards, for a web page to load a piece at a time.
 *
 * `generated.ts` imports every card up front. That suits the engine, the
 * server and the scripts, which need a registry that knows every card before
 * a game starts. A web page is the opposite case. The game table never needs
 * a card list, because the server's views carry each object's
 * characteristics. The pages that do need one, the library and the deck
 * builder, are better off fetching several megabytes of definitions as
 * parallel pieces after their own code than as part of it. So `gen:cards`
 * also writes the pool as shard modules under `shards/`, each reached through
 * its own dynamic `import()`, which a bundler turns into a separate file.
 *
 * A card's shard is a hash of its name, so anything holding a name knows
 * which shard to fetch, with no index of the pool to load first. The hash
 * reads nothing but the name: adding a card changes one shard, and every
 * other one keeps its content, and a browser's cached copy of it.
 *
 * None of this keeps a card out of a page that imports `generated.ts` by some
 * other route (`BUILTIN_CARDS`, `createDefaultRegistry`). What keeps the rest
 * of the engine from doing that is `"sideEffects": false` in its
 * `package.json`, which tells a bundler that an engine module nothing uses
 * can be left out. Without it, the `defineCard(…)` call every card file makes
 * as it loads would count as a side effect, and every card would ship with
 * whatever page reached the engine's barrel. That promise holds because no
 * engine module does anything at import time but define things; keep it so.
 */

import type { CardDefinition } from "./define.js";
import { SHARD_LOADERS } from "./shards/index.js";

/** What one shard holds: its real cards (`pool/`) and its tokens (`tokens/`),
 * kept apart for the same reason `POOL_CARDS` and `TOKEN_CARDS` are. */
export interface CardShard {
  readonly pool: readonly CardDefinition[];
  readonly tokens: readonly CardDefinition[];
}

/** How many shards the pool is split into (set in `scripts/gen-cards.mjs`). */
export const CARD_SHARD_COUNT: number = SHARD_LOADERS.length;

/**
 * The shard a card named `name` is in, if the pool has it: FNV-1a over the
 * name's UTF-16 code units. `scripts/gen-cards.mjs` places each card with
 * the same function, and `cards/pool.test.ts` checks that every card is in
 * the shard this names.
 */
export function cardShardOf(name: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % CARD_SHARD_COUNT;
}

/** Loads shard `index` (0 to `CARD_SHARD_COUNT - 1`). */
export async function loadCardShard(index: number): Promise<CardShard> {
  const load = SHARD_LOADERS[index];
  if (load === undefined) throw new RangeError(`no card shard ${index}`);
  return (await load()).default;
}
