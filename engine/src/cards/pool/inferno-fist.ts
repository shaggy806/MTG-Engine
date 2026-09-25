import { defineCard } from "../define.js";

export default defineCard({
  name: "Inferno Fist",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature you control\nEnchanted creature gets +2/+0.\n{R}, Sacrifice this Aura: This Aura deals 2 damage to any target.",
  targets: ["creature-you-control"],
  activated: [
    {
      cost: { mana: "{R}", tap: false, sacrifice: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{R}, Sacrifice this Aura: This Aura deals 2 damage to any target.",
    },
  ],
  static: [{ affects: { scope: "attached" }, grantPt: [2, 0], text: "Enchanted creature gets +2/+0." }],
});
