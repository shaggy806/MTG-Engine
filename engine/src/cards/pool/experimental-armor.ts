import { defineCard } from "../define.js";

export default defineCard({
  name: "Experimental Armor",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +1/+1 and has flying and haste. (It can't be blocked except by creatures with flying or reach. It can attack and {T} as soon as it comes under your control.)\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)",
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
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["flying", "haste"],
      text: "Equipped creature gets +1/+1 and has flying and haste.",
    },
  ],
});
