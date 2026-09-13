import { defineCard } from "../define.js";

export default defineCard({
  name: "Angelic Edict",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Exile target creature or enchantment.",
  targets: ["creature-or-enchantment"],
  effect: { kind: "exile", target: 0 },
});
