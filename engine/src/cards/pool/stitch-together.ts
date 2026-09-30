import { defineCard } from "../define.js";

// Threshold is checked as it resolves, while this spell is on the stack and
// not yet among the seven.
export default defineCard({
  name: "Stitch Together",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Return target creature card from your graveyard to your hand.\n" +
    "Threshold — Return that card from your graveyard to the battlefield instead if there are seven or more cards in your graveyard.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: {
    kind: "conditional",
    condition: { kind: "threshold" },
    then: { kind: "put-onto-battlefield", target: 0 },
    else: { kind: "return-to-hand", target: 0, from: "graveyard" },
  },
});
