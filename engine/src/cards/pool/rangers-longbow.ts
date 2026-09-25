import { defineCard } from "../define.js";

export default defineCard({
  name: "Ranger's Longbow",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +2/+1 and has reach.\nEquip {3} ({3}: Attach to target creature you control. Equip only as a sorcery.)",
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {3}",
      sorcerySpeed: true,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 1],
      grantKeywords: ["reach"],
      text: "Equipped creature gets +2/+1 and has reach.",
    },
  ],
});
