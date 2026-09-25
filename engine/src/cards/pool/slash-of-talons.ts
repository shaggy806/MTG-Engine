import { defineCard } from "../define.js";

export default defineCard({
  name: "Slash of Talons",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Slash of Talons deals 2 damage to target attacking or blocking creature.",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "damage", amount: 2, target: 0 },
});
