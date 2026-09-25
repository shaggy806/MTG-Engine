import { defineCard } from "../define.js";

export default defineCard({
  name: "Loxodon Warhammer",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +3/+0 and has trample and lifelink.\nEquip {3}",
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
      grantPt: [3, 0],
      grantKeywords: ["trample", "lifelink"],
      text: "Equipped creature gets +3/+0 and has trample and lifelink.",
    },
  ],
});
