import { defineCard } from "../define.js";

export default defineCard({
  name: "Wild Cantor",
  manaCost: "{R/G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 1,
  text: "({R/G} can be paid with either {R} or {G}.)\nSacrifice this creature: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "Sacrifice this creature: Add one mana of any color.",
    },
  ],
});
