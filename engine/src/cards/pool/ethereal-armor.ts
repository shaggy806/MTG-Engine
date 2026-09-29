import { defineCard } from "../define.js";

const TEXT = "Enchanted creature gets +1/+1 for each enchantment you control and has first strike.";

// Counts every enchantment you control — itself, and your Auras on an
// opponent's permanents (the ruling).
export default defineCard({
  name: "Ethereal Armor",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { type: "enchantment", controlledBy: "you" }, pt: [1, 1] },
      grantKeywords: ["first-strike"],
      text: TEXT,
    },
  ],
});
