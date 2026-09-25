import { defineCard } from "../define.js";

// #240 in top-commanders.txt.
//
// "You can't cast Rakdos unless an opponent lost life this turn" is checked
// from any zone, the command zone included.
const CAST_TEXT = "You can't cast Rakdos unless an opponent lost life this turn.";
const COST_TEXT =
  "Creature spells you cast cost {1} less to cast for each 1 life your opponents have lost this turn.";

export default defineCard({
  name: "Rakdos, Lord of Riots",
  manaCost: "{B}{B}{R}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying", "trample"],
  castOnlyIf: { kind: "turn-stat", stat: "life-lost", who: "opponent", atLeast: 1 },
  text: `${CAST_TEXT}\nFlying, trample\n${COST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature" },
        caster: "you",
        reduceGeneric: { turnStat: "life-lost", who: "opponent" },
      },
      text: COST_TEXT,
    },
  ],
});
