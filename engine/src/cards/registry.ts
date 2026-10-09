/** `CardRegistry` — resolves a card name to its printed definition — and the
 * default one, which knows every built-in card. */

import { CardRegistry } from "./card-registry.js";
import { EMBLEM_DEFINITIONS } from "./emblem.js";
import { FACE_DOWN_DEFINITIONS } from "./face-down.js";
import { BUILTIN_CARDS } from "./generated.js";

export { CardRegistry };

export function createDefaultRegistry(): CardRegistry {
  const registry = new CardRegistry();
  for (const card of BUILTIN_CARDS) registry.register(card);
  for (const card of FACE_DOWN_DEFINITIONS) registry.register(card);
  for (const card of EMBLEM_DEFINITIONS) registry.register(card);
  return registry;
}
