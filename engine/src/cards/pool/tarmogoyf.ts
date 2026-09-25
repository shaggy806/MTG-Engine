import { defineCard } from "../define.js";

// A characteristic-defining ability (rule 604.3), so it applies in every zone.
const TEXT =
  "Tarmogoyf's power is equal to the number of card types among cards in all graveyards and its " +
  "toughness is equal to that number plus 1.";

export default defineCard({
  name: "Tarmogoyf",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Lhurgoyf"],
  power: 0,
  toughness: 1,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: { countOf: { cardTypesInGraveyard: {} }, plusPower: 0, plusToughness: 1 },
      text: TEXT,
    },
  ],
});
