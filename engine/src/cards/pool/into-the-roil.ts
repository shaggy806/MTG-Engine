import { defineCard } from "../define.js";

// EDHREC rank 5401.
//
// Rulings:
//   [2009-10-01] If the targeted permanent is an illegal target by the time Into the Roil
//     resolves, the entire spell doesn't resolve. You don't draw a card.
//   [2024-11-08] The kicker ability doesn't let you pay a kicker cost more than once.
//   [2024-11-08] If you copy a kicked spell on the stack, the copy is also kicked.

export default defineCard({
  name: "Into the Roil",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Kicker {1}{U} (You may pay an additional {1}{U} as you cast this spell.)\nReturn target nonland permanent to its owner's hand. If this spell was kicked, draw a card.",
  targets: ["nonland-permanent"],
  effect: { kind: "return-to-hand", target: 0 },
  kicker: {
    cost: "{1}{U}",
    effect: {
      kind: "sequence",
      effects: [
        { kind: "return-to-hand", target: 0 },
        { kind: "draw", amount: 1 },
      ],
    },
  },
});
