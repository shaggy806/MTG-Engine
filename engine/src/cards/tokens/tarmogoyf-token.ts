import { defineCard } from "../define.js";

/** Disa the Restless's Tarmogoyf token: a green Lhurgoyf with Tarmogoyf's
 * characteristic-defining ability. */
const TEXT =
  "This token's power is equal to the number of card types among cards in all graveyards and its " +
  "toughness is equal to that number plus 1.";

export default defineCard({
  name: "Tarmogoyf Token",
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
