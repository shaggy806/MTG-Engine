import { defineCard } from "../define.js";

const TEXT = "Enchanted creature gets +1/+1 for each creature and/or enchantment you control.";

/** A modal double-faced card (Aura // land) — its back face, Haven of the
 * Harvest, is a land you play instead. A permanent that's both counts once. */
export default defineCard({
  name: "Strength of the Harvest",
  manaCost: "{2}{G/W}",
  colors: ["G", "W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { typesAnyOf: ["creature", "enchantment"], controlledBy: "you" }, pt: [1, 1] },
      text: TEXT,
    },
  ],
  faces: ["Strength of the Harvest", "Haven of the Harvest"],
});
