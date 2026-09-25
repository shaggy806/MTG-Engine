import { defineCard } from "../define.js";

export default defineCard({
  name: "Wanderer's Intervention",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Wanderer's Intervention deals 4 damage to target attacking or blocking creature.",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
