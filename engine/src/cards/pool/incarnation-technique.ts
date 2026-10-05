import { demonstrate } from "../helpers.js";
import { defineCard } from "../define.js";

// Port of Karfell's shape: any creature card there, one just milled or one
// already there, chosen after the mill (the rulings) — not a target.
const TEXT = "Mill five cards, then return a creature card from your graveyard to the battlefield.";

export default defineCard({
  name: "Incarnation Technique",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: `Demonstrate (When you cast this spell, you may copy it. If you do, choose an opponent to also copy it.)\n${TEXT}`,
  targets: [],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "mill", target: "you", amount: 5 },
      { kind: "return-from-graveyard", filter: { type: "creature" }, destination: "battlefield", count: 1 },
    ],
  },
  triggered: [demonstrate()],
});
