import { defineCard } from "../define.js";

export default defineCard({
  name: "Basilisk Collar",
  manaCost: "{1}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature has deathtouch and lifelink.\nEquip {2}",
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["deathtouch", "lifelink"],
      text: "Equipped creature has deathtouch and lifelink.",
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {2}",
      sorcerySpeed: true,
    },
  ],
});
