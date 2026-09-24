import { defineCard } from "../define.js";

/** Regenerate (rule 701.15 — 701.16 is Reveal) isn't modeled, so the "{B}:
 * Regenerate this creature" activated ability is dropped. That makes this
 * card one of AUTHORING §15's "Known exceptions": it predates rule zero (§0)
 * and would not be authorable today. Fix it or drop it; don't copy it. */
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
        countOf: { countInGraveyard: { type: "creature" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: "Mortivore's power and toughness are each equal to the number of creature cards in all graveyards.",
    },
  ],
});
