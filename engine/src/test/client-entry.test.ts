/**
 * `engine/client` (`client.ts`) is the engine as a web page imports it, and
 * must never reach a card definition: a page fetches those in shards when it
 * needs them, and Vite's dev server, which doesn't tree-shake, loads every
 * module a page's imports reach. This walks the imports that survive
 * compilation (every `import`/`export … from` but the `type`-only ones, which
 * `verbatimModuleSyntax` erases; a dynamic `import()` loads nothing until it
 * runs) and fails if any of them leads to a card file.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../", import.meta.url));

const STATIC_IMPORT = /^\s*(?:import|export)\s+(?!type\s)(?:[^'";]*?\sfrom\s+)?["'](\.[^"']+)["']/gm;

/** Every source file `entry`'s static imports reach, `entry` included. */
function reachedFrom(entry: string): Set<string> {
  const reached = new Set<string>([entry]);
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    for (const match of readFileSync(file, "utf8").matchAll(STATIC_IMPORT)) {
      const next = path.resolve(path.dirname(file), match[1].replace(/\.js$/, ".ts"));
      if (!reached.has(next)) {
        reached.add(next);
        queue.push(next);
      }
    }
  }
  return reached;
}

const relative = (file: string) => path.relative(SRC, file).split(path.sep).join("/");

describe("engine/client", () => {
  const reached = [...reachedFrom(path.join(SRC, "client.ts"))].map(relative);

  it("reaches no card definition", () => {
    const cards = reached.filter((f) => /^cards\/(generated\.ts|pool\/|tokens\/|shards\/shard-)/.test(f));
    expect(cards).toEqual([]);
  });

  it("is walked for real", () => {
    // The walk has to get somewhere for the check above to mean anything.
    expect(reached).toContain("cards/card-shards.ts");
    expect(reached).toContain("deck-validation.ts");
    // And would see the pool if it were there: the main barrel reaches it.
    expect([...reachedFrom(path.join(SRC, "index.ts"))].map(relative)).toContain(
      "cards/generated.ts",
    );
  });
});
