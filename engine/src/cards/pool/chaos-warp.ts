import { defineCard } from "../define.js";

// The owner shuffles it in — a token too, which ceases to exist but still
// gets the library shuffled — then reveals the top card of *their* library
// (`of: { ownerOfTarget }`, read even once the target has moved). A permanent
// card goes onto the battlefield under its owner's control; anything else,
// or a permanent card that can't enter (an Aura with nothing to enchant),
// stays on top (the rulings). An illegal target means none of it happens.
export default defineCard({
  name: "Chaos Warp",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "The owner of target permanent shuffles it into their library, then reveals the top card of their " +
    "library. If it's a permanent card, they put it onto the battlefield.",
  targets: ["permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "shuffle-into-library", target: 0 },
      {
        kind: "reveal-top",
        of: { ownerOfTarget: 0 },
        then: {
          kind: "conditional",
          condition: {
            kind: "target",
            index: 0,
            filter: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker"] },
          },
          then: { kind: "put-onto-battlefield", target: 0 },
        },
      },
    ],
  },
});
