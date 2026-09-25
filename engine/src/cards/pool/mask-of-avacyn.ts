import { defineCard } from "../define.js";

export default defineCard({
  name: "Mask of Avacyn",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +1/+2 and has hexproof. (It can't be the target of spells or abilities your opponents control.)\nEquip {3}",
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
      grantPt: [1, 2],
      grantKeywords: ["hexproof"],
      text: "Equipped creature gets +1/+2 and has hexproof.",
    },
  ],
});
