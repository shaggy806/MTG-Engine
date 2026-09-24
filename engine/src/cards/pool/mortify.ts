import { defineCard } from "../define.js";

export default defineCard({
  name: "Mortify",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  types: ["instant"],
  text: "Destroy target creature or enchantment.",
  targets: ["creature-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
});
