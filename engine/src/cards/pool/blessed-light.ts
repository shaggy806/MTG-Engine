import { defineCard } from "../define.js";

export default defineCard({
  name: "Blessed Light",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target creature or enchantment.",
  targets: ["creature-or-enchantment"],
  effect: { kind: "exile", target: 0 },
});
