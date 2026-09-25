import { defineCard } from "../define.js";

export default defineCard({
  name: "Skateboard",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "When this Equipment enters, tap target permanent.\nEquipped creature gets +1/+0 and has haste.\nEquip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)",
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
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["permanent"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "When this Equipment enters, tap target permanent.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 0],
      grantKeywords: ["haste"],
      text: "Equipped creature gets +1/+0 and has haste.",
    },
  ],
});
