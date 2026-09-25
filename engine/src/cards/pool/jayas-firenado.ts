import { defineCard } from "../define.js";

export default defineCard({
  name: "Jaya's Firenado",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Jaya's Firenado deals 5 damage to target creature or planeswalker. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 5, target: 0 }, { kind: "scry", amount: 1 }],
  },
});
