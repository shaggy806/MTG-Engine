import { defineCard } from "../define.js";

export default defineCard({
  name: "Brawler's Plate",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +2/+2 and has trample. (It can deal excess combat damage to the player or planeswalker it's attacking.)\nEquip {4} ({4}: Attach to target creature you control. Equip only as a sorcery.)",
  activated: [
    {
      cost: { mana: "{4}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {4}",
      sorcerySpeed: true,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["trample"],
      text: "Equipped creature gets +2/+2 and has trample.",
    },
  ],
});
