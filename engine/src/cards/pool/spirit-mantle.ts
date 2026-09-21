import { defineCard } from "../define.js";

export default defineCard({
  name: "Spirit Mantle",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+1 and has protection from creatures.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      // Protection from a card *type*, which needs no filter — the enchanted
      // creature simply can't be blocked by, or targeted by, any creature.
      protection: { types: ["creature"] },
      text: "Enchanted creature gets +1/+1 and has protection from creatures.",
    },
  ],
});
