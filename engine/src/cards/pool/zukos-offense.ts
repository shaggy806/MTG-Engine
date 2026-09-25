import { defineCard } from "../define.js";

export default defineCard({
  name: "Zuko's Offense",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Zuko's Offense deals 2 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 2, target: 0 },
});
