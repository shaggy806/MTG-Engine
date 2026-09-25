import { defineCard } from "../define.js";

export default defineCard({
  name: "Priest of Iroas",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{3}{W}, Sacrifice this creature: Destroy target enchantment.",
  activated: [
    {
      cost: { mana: "{3}{W}", tap: false, sacrifice: "self" },
      targets: ["enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{3}{W}, Sacrifice this creature: Destroy target enchantment.",
    },
  ],
});
