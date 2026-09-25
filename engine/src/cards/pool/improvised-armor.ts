import { defineCard } from "../define.js";

export default defineCard({
  name: "Improvised Armor",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  cycling: { cost: "{3}" },
  text: "Enchant creature\nEnchanted creature gets +2/+5.\nCycling {3} ({3}, Discard this card: Draw a card.)",
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [2, 5], text: "Enchanted creature gets +2/+5." }],
});
