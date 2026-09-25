import { defineCard } from "../define.js";

export default defineCard({
  name: "Gideon's Reproach",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Gideon's Reproach deals 4 damage to target attacking or blocking creature.",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
