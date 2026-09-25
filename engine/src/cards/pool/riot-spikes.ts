import { defineCard } from "../define.js";

export default defineCard({
  name: "Riot Spikes",
  manaCost: "{B/R}",
  colors: ["B", "R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "({B/R} can be paid with either {B} or {R}.)\nEnchant creature\nEnchanted creature gets +2/-1.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, -1],
      text: "Enchanted creature gets +2/-1.",
    },
  ],
});
