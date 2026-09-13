import { defineCard } from "../define.js";

/** Regenerate (rule 701.16) isn't modeled — the "{B}: Regenerate this
 * creature" activated ability is dropped. */
export default defineCard({
  name: "Mortivore",
  manaCost: "{2}{B}{B}",
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
