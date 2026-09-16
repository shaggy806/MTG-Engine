import { defineCard } from "../define.js";

export default defineCard({
  name: "Breath of Malfegor",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  types: ["instant"],
  text: "Breath of Malfegor deals 5 damage to each opponent.",
  effect: { kind: "damage", amount: 5, who: "each-opponent" },
});
