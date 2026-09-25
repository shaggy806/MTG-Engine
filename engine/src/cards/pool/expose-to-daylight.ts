import { defineCard } from "../define.js";

export default defineCard({
  name: "Expose to Daylight",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment. Scry 1.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "scry", amount: 1 }] },
});
