import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 3403.
//
// Rulings:
//   [2025-07-25] The kicker ability doesn’t let you pay a kicker cost more than once.
//   [2025-07-25] If a spell’s kicker cost was paid, the spell is “kicked.”
//   [2025-07-25] To determine a spell’s total cost, start with the mana cost (or an alternative
//     cost if another card’s effect allows you to pay one instead), add any cost increases (such
//     as kicker), then apply any cost reductions. The spell’s mana value remains unchanged, no
//     matter what the total cost to cast it was.
//   [2025-07-25] If you copy a kicked spell on the stack, the copy is also kicked.
//   [2025-07-25] The value of X is calculated only once, as Consult the Star Charts resolves.

// X — the lands you control — is read once, as the look happens (the
// ruling). Fomori Vault's look-and-choose shape.
const look = (n: number): EffectSpec => ({
  kind: "look-and-choose",
  zone: "library",
  count: { countOf: { type: "land", controlledBy: "you" } },
  min: n,
  max: n,
  destination: "hand",
  leftover: "bottom-random",
});

export default defineCard({
  name: "Consult the Star Charts",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Kicker {1}{U} (You may pay an additional {1}{U} as you cast this spell.)\nLook at the top X cards of your library, where X is the number of lands you control. Put one of those cards into your hand. If this spell was kicked, put two of those cards into your hand instead. Put the rest on the bottom of your library in a random order.",
  effect: look(1),
  kicker: { cost: "{1}{U}", effect: look(2) },
});
