import { defineCard } from "../define.js";

export default defineCard({
  name: "Gorgon's Head",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature has deathtouch.\nEquip {2}",
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
      grantKeywords: ["deathtouch"],
      text: "Equipped creature has deathtouch.",
    },
  ],
});
