import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 5792.

export default defineCard({
  name: "Fight On!",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Return up to two target creature cards from your graveyard to your hand.",
  targets: distinctTargets(2, { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }, { optional: true }),
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "return-to-hand", target: 0, from: "graveyard" },
      { kind: "return-to-hand", target: 1, from: "graveyard" },
    ],
  },
});
