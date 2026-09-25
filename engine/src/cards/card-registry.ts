/**
 * `CardRegistry` — resolves a card name to its printed definition.
 *
 * Its own module, apart from `createDefaultRegistry` (`registry.ts`), because
 * that one imports every card: a web page builds its registry from the card
 * shards it has loaded instead, and must be able to reach the class without
 * the pool (see `client.ts`).
 */

import type { CardDefinition } from "./define.js";

export class CardRegistry {
  private readonly byName = new Map<string, CardDefinition>();

  register(def: CardDefinition): this {
    if (this.byName.has(def.name)) {
      throw new Error(`card already registered: ${def.name}`);
    }
    this.byName.set(def.name, def);
    return this;
  }

  has(name: string): boolean {
    return this.byName.has(name);
  }

  get(name: string): CardDefinition {
    const def = this.byName.get(name);
    if (def === undefined) throw new Error(`unknown card: ${name}`);
    return def;
  }

  get size(): number {
    return this.byName.size;
  }
}
