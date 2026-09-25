import { defineCard } from "../define.js";

export default defineCard({
  name: "Hamato Ninpō",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Hamato Ninpō deals 4 damage to target attacking or blocking creature.",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
