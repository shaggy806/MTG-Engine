import { defineCard } from "../define.js";

// EDHREC rank 3123.
//
// Rulings:
//   [2017-09-29] The reduction applies to the total cost; the mana value of the creature remains
//     unchanged.
//   [2018-01-19] A "Dinosaur spell" is only a spell that has the subtype.

const COST_TEXT = "Dinosaur spells you cast cost {1} less to cast.";
const HASTE_TEXT = "{T}: Target Dinosaur gains haste until end of turn.";

export default defineCard({
  name: "Otepec Huntmaster",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 2,
  text: `${COST_TEXT}\n${HASTE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtype: "Dinosaur" }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "permanent", whose: "any", filter: { subtype: "Dinosaur" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: HASTE_TEXT,
    },
  ],
});
