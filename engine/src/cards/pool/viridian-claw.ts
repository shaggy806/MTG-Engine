import { defineCard } from "../define.js";

export default defineCard({
  name: "Viridian Claw",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +1/+0 and has first strike.\nEquip {1}",
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
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 0],
      grantKeywords: ["first-strike"],
      text: "Equipped creature gets +1/+0 and has first strike.",
    },
  ],
});
