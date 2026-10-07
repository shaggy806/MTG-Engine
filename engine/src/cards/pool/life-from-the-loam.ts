import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// Dredge replaces any draw, not only the draw step's, one draw at a time; it
// can't be used with fewer than three cards in the library (the rulings —
// `CardDefinition.dredge`).
export default defineCard({
  name: "Life from the Loam",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  dredge: 3,
  text:
    "Return up to three target land cards from your graveyard to your hand.\n" +
    "Dredge 3 (If you would draw a card, you may mill three cards instead. If you do, return this card from your graveyard to your hand.)",
  targets: distinctTargets(3, { kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }, { optional: true }),
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "return-to-hand", target: 0, from: "graveyard" },
      { kind: "return-to-hand", target: 1, from: "graveyard" },
      { kind: "return-to-hand", target: 2, from: "graveyard" },
    ],
  },
});
