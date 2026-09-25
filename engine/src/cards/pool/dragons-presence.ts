import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon's Presence",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Dragon's Presence deals 5 damage to target attacking or blocking creature.",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
