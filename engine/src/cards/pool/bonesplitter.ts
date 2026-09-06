import { defineCard } from "../define.js";

export default defineCard({
  name: "Bonesplitter",
  manaCost: "{1}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +2/+0. Equip {1}",
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      text: "Equipped creature gets +2/+0.",
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
