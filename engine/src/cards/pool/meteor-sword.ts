import { defineCard } from "../define.js";

export default defineCard({
  name: "Meteor Sword",
  manaCost: "{7}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "When this Equipment enters, destroy target permanent.\nEquipped creature gets +3/+3.\nEquip {3} ({3}: Attach to target creature you control. Equip only as a sorcery.)",
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
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this Equipment enters, destroy target permanent.",
    },
  ],
  static: [{ affects: { scope: "attached" }, grantPt: [3, 3], text: "Equipped creature gets +3/+3." }],
});
