import { defineCard } from "../define.js";

// EDHREC rank 5882.
//
// Rulings:
//   [2020-04-17] A spell that can't be countered is a legal target for Keep Safe. That spell won't
//     be countered when Keep Safe resolves, but you'll still draw a card.
//   [2020-04-17] If the permanent you control targeted by the target spell leaves the battlefield,
//     that spell is no longer a legal target for Keep Safe.

export default defineCard({
  name: "Keep Safe",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell that targets a permanent you control.\nDraw a card.",
  // Rebuff the Wicked's target, then the draw.
  targets: [{ kind: "spell", filter: { targets: { permanent: { controlledBy: "you" } } } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "draw", amount: 1 },
    ],
  },
});
