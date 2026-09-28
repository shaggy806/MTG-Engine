/**
 * Runs after `tsc` (the engine's `build`): bundles each card shard in `dist/`
 * into one file, with its cards inlined.
 *
 * `tsc` emits `dist/cards/shards/shard-NN.js` as it was written — ~180 imports,
 * one per card file. A production bundle folds those into one chunk per shard
 * anyway, but Vite's dev server doesn't bundle: the library and the deck
 * builder, which load all 32 shards, made one request per card (5,800 of
 * them) and took 39 s to open after the dev server started, then 4-5 s on
 * every load while the browser revalidated each file.
 *
 * Only the card files are inlined — `cards/pool/*` and `cards/tokens/*`, which
 * nothing else imports on the way to a shard. Everything they import (the
 * definitions' helpers, the effect vocabulary) stays an ordinary import of the
 * shared module, so a page still has one copy of each and the rest of `dist/`
 * is untouched. `pool/`, `tokens/` and `shards/` are all children of `cards/`,
 * so a card's own relative import ("../define.js", "../../effects.js") means
 * the same thing written in its shard.
 *
 * Only the web client loads shards (`loadCardShard`); the engine's tests read
 * `src/`, and the server reaches cards through the barrel, never a shard.
 */

import { readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rolldown } from "rolldown";

const here = path.dirname(fileURLToPath(import.meta.url));
const cardsDir = path.resolve(here, "../dist/cards");
const shardsDir = path.join(cardsDir, "shards");
const inlined = [path.join(cardsDir, "pool") + path.sep, path.join(cardsDir, "tokens") + path.sep];

const stagingDir = path.join(cardsDir, ".shards-bundling");
rmSync(stagingDir, { recursive: true, force: true });

const shards = readdirSync(shardsDir).filter((f) => /^shard-\d+\.js$/.test(f));
if (shards.length === 0) throw new Error(`no shards in ${shardsDir} — run tsc first`);

const t0 = Date.now();
let cards = 0;
for (const file of shards) {
  const input = path.join(shardsDir, file);
  const bundle = await rolldown({
    input,
    platform: "neutral",
    // The card files are the whole of the shard's own code; a tree-shaken
    // definition would be a card missing from the pool.
    treeshake: false,
    plugins: [
      {
        name: "inline-cards-only",
        resolveId(source, importer) {
          if (importer === undefined || !source.startsWith(".")) return null;
          const resolved = path.resolve(path.dirname(importer), source);
          if (inlined.some((dir) => resolved.startsWith(dir))) {
            cards += 1;
            return resolved;
          }
          // Shared: keep it an import, written as the shard sees it.
          const fromShard = path.relative(shardsDir, resolved).split(path.sep).join("/");
          return { id: fromShard.startsWith(".") ? fromShard : `./${fromShard}`, external: true };
        },
      },
    ],
  });
  // Written beside `shards/` at the same depth, so the file name in its
  // source-map comment and the map's relative source paths come out right.
  const tmp = path.join(stagingDir, file);
  await bundle.write({ file: tmp, format: "esm", sourcemap: true });
  await bundle.close();
  renameSync(tmp, input);
  renameSync(`${tmp}.map`, `${input}.map`);
}
rmSync(stagingDir, { recursive: true, force: true });
console.log(`bundled ${shards.length} card shards (${cards} card modules inlined) in ${Date.now() - t0} ms`);
