import { defineCard } from "../define.js";

export default defineCard({
  name: "Pyroclasm",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Pyroclasm deals 2 damage to each creature.",
  effect: { kind: "damage-all", filter: { type: "creature" }, amount: 2 },
});
