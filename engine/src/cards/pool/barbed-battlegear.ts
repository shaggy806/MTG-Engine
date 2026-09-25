import { defineCard } from "../define.js";

export default defineCard({
  name: "Barbed Battlegear",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +4/-1.\nEquip {2}",
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
  static: [{ affects: { scope: "attached" }, grantPt: [4, -1], text: "Equipped creature gets +4/-1." }],
});
