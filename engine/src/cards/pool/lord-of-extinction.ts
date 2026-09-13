import { defineCard } from "../define.js";

export default defineCard({
  name: "Lord of Extinction",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 0,
  toughness: 0,
  text: "Lord of Extinction's power and toughness are each equal to the total number of cards in all graveyards.",
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: "cards-in-all-graveyards",
        plusPower: 0,
        plusToughness: 0,
      },
      text: "Lord of Extinction's power and toughness are each equal to the total number of cards in all graveyards.",
    },
  ],
});
