import { defineCard } from "../define.js";

export default defineCard({
  name: "Playful Shove",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Playful Shove deals 1 damage to any target.\nDraw a card.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 1, target: 0 }, { kind: "draw", amount: 1 }],
  },
});
