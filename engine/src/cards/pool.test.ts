/**
 * Guards the one-file-per-card layout: every `.ts` under `pool/` and `tokens/`
 * must default-export a `CardDefinition`, names must be unique, and the set on
 * disk must exactly match what `createDefaultRegistry()` builds — so adding a
 * card file without re-running `scripts/gen-cards.mjs` fails here rather than
 * silently shipping a card that no registry knows about.
 */

import { describe, expect, it } from "vitest";
import type { CardDefinition } from "./define.js";
import { createDefaultRegistry } from "./registry.js";

const modules = import.meta.glob<{ default: CardDefinition }>(
  ["./pool/*.ts", "./tokens/*.ts"],
  { eager: true },
);

const files = Object.entries(modules).filter(([p]) => !p.endsWith(".test.ts"));

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
});
