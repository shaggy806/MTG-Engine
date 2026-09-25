import { defineCard } from "../define.js";

export default defineCard({
  name: "Crude Bent Blade",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "When this Equipment enters, target opponent sacrifices a creature of their choice.\nEquipped creature gets +2/+1.\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)",
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
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: { kind: "sacrifice", who: "target", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "When this Equipment enters, target opponent sacrifices a creature of their choice.",
    },
  ],
  static: [{ affects: { scope: "attached" }, grantPt: [2, 1], text: "Equipped creature gets +2/+1." }],
});
