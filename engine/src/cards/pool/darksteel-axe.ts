import { defineCard } from "../define.js";

export default defineCard({
  name: "Darksteel Axe",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  keywords: ["indestructible"],
  text: "Indestructible (Effects that say \"destroy\" don't destroy this Equipment.)\nEquipped creature gets +2/+0.\nEquip {2}",
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
  static: [{ affects: { scope: "attached" }, grantPt: [2, 0], text: "Equipped creature gets +2/+0." }],
});
