import { defineCard } from "../define.js";

export default defineCard({
  name: "Cobbled Wings",
  manaCost: "{2}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature has flying.\nEquip {1}",
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["flying"],
      text: "Equipped creature has flying.",
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
