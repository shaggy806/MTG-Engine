import { defineCard } from "../define.js";

export default defineCard({
  name: "Flame Rift",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Flame Rift deals 4 damage to each player.",
  effect: { kind: "damage", amount: 4, who: "each-player" },
});
