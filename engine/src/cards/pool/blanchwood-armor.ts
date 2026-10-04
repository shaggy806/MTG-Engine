import { defineCard } from "../define.js";

// EDHREC rank 3080.
//
// Ethereal Armor's shape; "you" is the Aura's controller.
const TEXT = "Enchanted creature gets +1/+1 for each Forest you control.";

export default defineCard({
  name: "Blanchwood Armor",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { subtype: "Forest", controlledBy: "you" }, pt: [1, 1] },
      text: TEXT,
    },
  ],
});
