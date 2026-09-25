import { defineCard } from "../define.js";

export default defineCard({
  name: "Desert Sandstorm",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Desert Sandstorm deals 1 damage to each creature.",
  effect: { kind: "damage-all", amount: 1, filter: { type: "creature" } },
});
