import { defineCard } from "../define.js";

export default defineCard({
  name: "Accorder's Shield",
  manaCost: "{0}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +0/+3 and has vigilance. (Attacking doesn't cause it to tap.)\nEquip {3} ({3}: Attach to target creature you control. Equip only as a sorcery.)",
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
      grantPt: [0, 3],
      grantKeywords: ["vigilance"],
      text: "Equipped creature gets +0/+3 and has vigilance.",
    },
  ],
});
