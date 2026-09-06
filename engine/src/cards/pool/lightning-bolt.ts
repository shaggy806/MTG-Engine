import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightning Bolt",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Lightning Bolt deals 3 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
