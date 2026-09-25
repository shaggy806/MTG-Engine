import { defineCard } from "../define.js";

export default defineCard({
  name: "Chitinous Cloak",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +2/+2 and has menace. (It can't be blocked except by two or more creatures.)\nEquip {3}",
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
      grantKeywords: ["menace"],
      text: "Equipped creature gets +2/+2 and has menace.",
    },
  ],
});
