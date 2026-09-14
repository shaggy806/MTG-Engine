import { defineCard } from "../define.js";

export default defineCard({
  name: "Swiftfoot Boots",
  manaCost: "{2}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature has hexproof and haste.\nEquip {1}",
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["hexproof", "haste"],
      text: "Equipped creature has hexproof and haste.",
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {1}",
      sorcerySpeed: true,
    },
  ],
});
