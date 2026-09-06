/** `CardRegistry` — resolves a card name to its printed definition. */

import type { CardDefinition } from "./define.js";
import { BUILTIN_CARDS } from "./generated.js";

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

export function createDefaultRegistry(): CardRegistry {
  const registry = new CardRegistry();
  for (const card of BUILTIN_CARDS) registry.register(card);
  return registry;
}
