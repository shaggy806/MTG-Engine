import { defineCard } from "../define.js";

export default defineCard({
  name: "Cyclops of Eternal Fury",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["enchantment", "creature"],
  subtypes: ["Cyclops"],
  power: 5,
  toughness: 3,
  text: "Creatures you control have haste.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
  ],
});
