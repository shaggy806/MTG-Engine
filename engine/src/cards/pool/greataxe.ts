import { defineCard } from "../define.js";

export default defineCard({
  name: "Greataxe",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +4/+0.\nEquip {5} ({5}: Attach to target creature you control. Equip only as a sorcery.)",
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
  static: [{ affects: { scope: "attached" }, grantPt: [4, 0], text: "Equipped creature gets +4/+0." }],
});
