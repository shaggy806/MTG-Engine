import { defineCard } from "../define.js";

export default defineCard({
  name: "Impeccable Timing",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Impeccable Timing deals 3 damage to target attacking or blocking creature.",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
