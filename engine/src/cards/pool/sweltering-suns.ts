import { defineCard } from "../define.js";

export default defineCard({
  name: "Sweltering Suns",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Sweltering Suns deals 3 damage to each creature.\nCycling {3}",
  effect: { kind: "damage-all", filter: { type: "creature" }, amount: 3 },
  cycling: { cost: "{3}" },
});
