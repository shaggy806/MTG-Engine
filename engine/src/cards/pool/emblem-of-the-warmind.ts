import { defineCard } from "../define.js";

export default defineCard({
  name: "Emblem of the Warmind",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature you control\nCreatures you control have haste.",
  targets: ["creature-you-control"],
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
  ],
});
