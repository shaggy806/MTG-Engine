import { defineCard } from "../define.js";

export default defineCard({
  name: "Ember Shot",
  manaCost: "{6}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Ember Shot deals 3 damage to any target.\nDraw a card.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "draw", amount: 1 }],
  },
});
