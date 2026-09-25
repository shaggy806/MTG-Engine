import { defineCard } from "../define.js";

export default defineCard({
  name: "Boltwave",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Boltwave deals 3 damage to each opponent.",
  effect: { kind: "damage", amount: 3, who: "each-opponent" },
});
