import { defineCard } from "../define.js";

export default defineCard({
  name: "Behemoth Sledge",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +2/+2 and has trample and lifelink.\nEquip {3}",
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
      grantPt: [2, 2],
      grantKeywords: ["trample", "lifelink"],
      text: "Equipped creature gets +2/+2 and has trample and lifelink.",
    },
  ],
});
