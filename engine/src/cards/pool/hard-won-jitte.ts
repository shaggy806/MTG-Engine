import { defineCard } from "../define.js";

export default defineCard({
  name: "Hard-Won Jitte",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature has double strike.\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)",
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
      grantKeywords: ["double-strike"],
      text: "Equipped creature has double strike.",
    },
  ],
});
