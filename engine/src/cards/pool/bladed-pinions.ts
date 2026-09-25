import { defineCard } from "../define.js";

export default defineCard({
  name: "Bladed Pinions",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature has flying and first strike.\nEquip {2}",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {2}",
      sorcerySpeed: true,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["flying", "first-strike"],
      text: "Equipped creature has flying and first strike.",
    },
  ],
});
