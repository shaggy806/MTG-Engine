import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// The free spell is cast while the Expertise is still resolving (rule
// 608.2g) — it may be one of the cards just returned — and resolves first.
// With every target gone illegal the Expertise doesn't resolve at all, and
// no spell is cast (rule 608.2b).
const TEXT =
  "Return up to three target artifacts and/or creatures to their owners' hands.\nYou may cast a spell with mana value 4 or less from your hand without paying its mana cost.";

export default defineCard({
  name: "Baral's Expertise",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: TEXT,
  targets: distinctTargets(3, { kind: "permanent", filter: { typesAnyOf: ["artifact", "creature"] } }, { optional: true }),
  effect: {
    kind: "sequence",
    effects: [
      {
        // One instruction over every target: they return together.
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "return-to-hand", target: 0 },
          { kind: "return-to-hand", target: 1 },
          { kind: "return-to-hand", target: 2 },
        ],
      },
      { kind: "cast-now", from: "hand", free: true, spell: { manaValue: { op: "lte", n: 4 } } },
    ],
  },
});
