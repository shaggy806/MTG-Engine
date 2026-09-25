import { defineCard } from "../define.js";

export default defineCard({
  name: "Ogre's Cleaver",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +5/+0.\nEquip {5}",
  activated: [
    {
      cost: { mana: "{5}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {5}",
      sorcerySpeed: true,
    },
  ],
  static: [{ affects: { scope: "attached" }, grantPt: [5, 0], text: "Equipped creature gets +5/+0." }],
});
