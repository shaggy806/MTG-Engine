import { defineCard } from "../define.js";
import { regenerateSelfAbility } from "../helpers.js";

/** Regeneration (rule 701.15) saves it from being destroyed, not from the
 * 0 toughness of empty graveyards (704.5f isn't destruction). */
export default defineCard({
  name: "Mortivore",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Lhurgoyf"],
  power: 0,
  toughness: 0,
  text:
    "Mortivore's power and toughness are each equal to the number of creature cards in all graveyards.\n" +
    "{B}: Regenerate this creature.",
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
  activated: [regenerateSelfAbility("{B}", "{B}: Regenerate this creature.")],
});
