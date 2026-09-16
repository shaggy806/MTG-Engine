import { defineCard } from "../define.js";

export default defineCard({
  name: "Slate of Ancestry",
  manaCost: "{4}",
  types: ["artifact"],
  text: "{4}, {T}, Discard your hand: Draw a card for each creature you control.",
  activated: [
    {
      // The discard is a *cost*, so it happens before the draw — which is
      // what makes this a refill rather than a wash.
      cost: { mana: "{4}", tap: true, discardHand: true },
      targets: [],
      effect: {
        kind: "draw",
        amount: { countOf: { type: "creature", controlledBy: "you" } },
      },
      resolve: null,
      text: "{4}, {T}, Discard your hand: Draw a card for each creature you control.",
    },
  ],
});
