import { defineCard } from "../define.js";

export default defineCard({
  name: "Electrify",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Electrify deals 4 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
