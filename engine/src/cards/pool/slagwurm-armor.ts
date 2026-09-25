import { defineCard } from "../define.js";

export default defineCard({
  name: "Slagwurm Armor",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +0/+6.\nEquip {3} ({3}: Attach to target creature you control. Equip only as a sorcery. This card enters unattached and stays on the battlefield if the creature leaves.)",
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
  static: [{ affects: { scope: "attached" }, grantPt: [0, 6], text: "Equipped creature gets +0/+6." }],
});
