import { defineCard } from "../define.js";

export default defineCard({
  name: "Greatsword",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +3/+0.\nEquip {3} ({3}: Attach to target creature you control. Equip only as a sorcery.)",
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
  static: [{ affects: { scope: "attached" }, grantPt: [3, 0], text: "Equipped creature gets +3/+0." }],
});
