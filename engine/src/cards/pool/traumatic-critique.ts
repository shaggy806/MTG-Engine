import { defineCard } from "../define.js";

export default defineCard({
  name: "Traumatic Critique",
  manaCost: "{X}{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text: "Traumatic Critique deals X damage to any target. Draw two cards, then discard a card.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: "x", target: 0 },
      {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 1 }],
      },
    ],
  },
});
