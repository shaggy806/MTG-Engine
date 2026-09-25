import { defineCard } from "../define.js";

export default defineCard({
  name: "Arrows of Justice",
  manaCost: "{2}{R/W}",
  colors: ["W", "R"],
  types: ["instant"],
  text: "Arrows of Justice deals 4 damage to target attacking or blocking creature.",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
