import { defineCard } from "../define.js";

// EDHREC rank 3876.

export default defineCard({
  name: "Star of Extinction",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Destroy target land. Star of Extinction deals 20 damage to each creature and each planeswalker.",
  targets: ["land"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "damage-all", filter: { typesAnyOf: ["creature", "planeswalker"] }, amount: 20 },
    ],
  },
});
