import { defineCard } from "../define.js";

// #232 in top-commanders.txt.
//
// "The first spell you cast with {X} in its mana cost each turn" is asked of
// the spells cast this turn as they were cast, one cast before Zimone arrived
// included: it used the discount up. The reduction comes off the generic
// part, which X is part of once chosen (rule 601.2f).
const REDUCE_TEXT =
  "The first spell you cast with {X} in its mana cost each turn costs {1} less to cast for each +1/+1 counter " +
  "on Zimone.";
const GROW_TEXT =
  "Whenever you cast your first spell with {X} in its mana cost each turn, put two +1/+1 counters on Zimone.";

export default defineCard({
  name: "Zimone, Infinite Analyst",
  manaCost: "{1}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 0,
  toughness: 4,
  text: `${REDUCE_TEXT}\n${GROW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { xInManaCost: true },
        caster: "you",
        firstEachTurn: true,
        reduceGeneric: { countersOnSource: "+1/+1" },
      },
      text: REDUCE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", firstEachTurn: true, filter: { xInManaCost: true } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
