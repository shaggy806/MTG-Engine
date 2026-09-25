import { defineCard } from "../define.js";

export default defineCard({
  name: "Kor Halberd",
  manaCost: "{W}",
  colors: ["W"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +1/+1 and has vigilance.\nEquip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)",
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
      grantPt: [1, 1],
      grantKeywords: ["vigilance"],
      text: "Equipped creature gets +1/+1 and has vigilance.",
    },
  ],
});
