import { defineCard } from "../define.js";

export default defineCard({
  name: "Sarkhan's Catharsis",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Sarkhan's Catharsis deals 5 damage to target player or planeswalker.",
  targets: ["player-or-planeswalker"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
