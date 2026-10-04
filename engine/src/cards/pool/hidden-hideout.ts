import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 3689.
//
// Rulings:
//   [2026-01-27] If you have two commanders, Hidden Hideout's first ability adds one mana of any
//     color in their combined color identities.
//   [2026-01-27] If your commander is a card that has no colors in its color identity, Hidden
//     Hideout's first ability produces no mana. It doesn't produce {C}.
//   [2026-01-27] If you don't have a commander, Hidden Hideout's first ability produces no mana.
//
// Command Tower's `commander-identity` mana; "with a counter on it" is any
// kind of counter (`counters` with no `kind`).
const LIFELINK_TEXT = "{2}, {T}: Target creature you control with a counter on it gains lifelink until end of turn.";

export default defineCard({
  name: "Hidden Hideout",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add one mana of any color in your commander's color identity.\n${LIFELINK_TEXT}`,
  activated: [
    addManaAbility({ mana: "commander-identity", text: "{T}: Add one mana of any color in your commander's color identity." }),
    {
      cost: { mana: "{2}", tap: true },
      targets: [
        {
          kind: "permanent",
          whose: "you",
          filter: { type: "creature", counters: { compare: { op: "gte", n: 1 } } },
        },
      ],
      effect: { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
      resolve: null,
      text: LIFELINK_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
