import { defineCard } from "../define.js";

export default defineCard({
  name: "Shock",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Shock deals 2 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 2, target: 0 },
});
