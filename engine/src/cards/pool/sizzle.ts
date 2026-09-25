import { defineCard } from "../define.js";

export default defineCard({
  name: "Sizzle",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Sizzle deals 3 damage to each opponent.",
  effect: { kind: "damage", amount: 3, who: "each-opponent" },
});
