import { defineCard } from "../define.js";

export default defineCard({
  name: "Unfriendly Fire",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Unfriendly Fire deals 4 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
