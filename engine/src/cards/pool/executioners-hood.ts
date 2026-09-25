import { defineCard } from "../define.js";

export default defineCard({
  name: "Executioner's Hood",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature has intimidate. (This creature can't be blocked except by artifact creatures and/or creatures that share a color with it.)\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)",
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
      grantKeywords: ["intimidate"],
      text: "Equipped creature has intimidate.",
    },
  ],
});
