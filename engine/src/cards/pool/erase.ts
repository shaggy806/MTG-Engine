import { defineCard } from "../define.js";

export default defineCard({
  name: "Erase",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target enchantment.",
  targets: ["enchantment"],
  effect: { kind: "exile", target: 0 },
});
