import { defineCard } from "../define.js";

export default defineCard({
  name: "Spidersilk Net",
  manaCost: "{0}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +0/+2 and has reach. (It can block creatures with flying.)\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)",
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
      grantPt: [0, 2],
      grantKeywords: ["reach"],
      text: "Equipped creature gets +0/+2 and has reach.",
    },
  ],
});
