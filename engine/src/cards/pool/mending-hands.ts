import { defineCard } from "../define.js";

export default defineCard({
  name: "Mending Hands",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Prevent the next 4 damage that would be dealt to any target this turn.",
  targets: ["any-target"],
  effect: { kind: "prevent-damage", target: 0, amount: 4 },
});
