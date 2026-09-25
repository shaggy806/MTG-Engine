import { defineCard } from "../define.js";

export default defineCard({
  name: "Vibranium Energy Daggers",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  keywords: ["indestructible"],
  text: "Indestructible (Effects that say \"destroy\" don't destroy this Equipment.)\nEquipped creature gets +2/+2.\nEquip {3} ({3}: Attach to target creature you control. Equip only as a sorcery.)",
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
  static: [{ affects: { scope: "attached" }, grantPt: [2, 2], text: "Equipped creature gets +2/+2." }],
});
