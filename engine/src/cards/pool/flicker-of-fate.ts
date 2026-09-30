import { defineCard } from "../define.js";

export default defineCard({
  name: "Flicker of Fate",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target creature or enchantment, then return it to the battlefield under its owner's control.",
  targets: ["creature-or-enchantment"],
  effect: { kind: "flicker", target: 0 },
});
