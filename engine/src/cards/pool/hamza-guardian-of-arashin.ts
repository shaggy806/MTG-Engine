import { defineCard } from "../define.js";

// EDHREC rank 3486.
//
// Rulings:
//   [2020-11-10] Once you announce you're casting a creature spell, no player may take actions
//     until the spell has been paid for. Notably, opponents can't try to change the number of
//     creatures you control with +1/+1 counters.
//   [2020-11-10] Hamza's first ability affects only generic mana costs. It can't reduce the total
//     cost to cast the spell below {G}{W}.
//   [2020-11-10] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you're paying, add any cost increases, then apply any cost reductions (such as that of
//     Hamza, Guardian of Arashin). The total cost is locked in before any costs are paid. The mana
//     value of the spell is determined only by its mana cost, no matter what the total cost to
//     cast the spell was.

// Generic mana only (the ruling) — `reduceGeneric`, as Animar's.
const COUNTERED = {
  type: "creature",
  controlledBy: "you",
  counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } },
} as const;

export default defineCard({
  name: "Hamza, Guardian of Arashin",
  manaCost: "{4}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elephant", "Warrior"],
  power: 5,
  toughness: 5,
  text: "This spell costs {1} less to cast for each creature you control with a +1/+1 counter on it.\nCreature spells you cast cost {1} less to cast for each creature you control with a +1/+1 counter on it.",
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { countOf: COUNTERED },
  },
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature" },
        caster: "you",
        reduceGeneric: { countOf: COUNTERED },
      },
      text: "Creature spells you cast cost {1} less to cast for each creature you control with a +1/+1 counter on it.",
    },
  ],
});
