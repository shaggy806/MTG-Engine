import { defineCard } from "../define.js";

export default defineCard({
  name: "Mortivore",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Lhurgoyf"],
  power: 0,
  toughness: 0,
  text: "Mortivore's power and toughness are each equal to the number of creature cards in all graveyards.",
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: "creature-cards-in-all-graveyards",
        plusPower: 0,
        plusToughness: 0,
      },
      text: "Mortivore's power and toughness are each equal to the number of creature cards in all graveyards.",
    },
  ],
});
