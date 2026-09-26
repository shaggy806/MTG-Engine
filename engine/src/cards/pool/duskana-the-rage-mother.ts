import { defineCard } from "../define.js";

// #420 in top-commanders.txt.
//
// "Base power and toughness 2/2" is the `basePower` / `baseToughness` filter
// clauses (rule 613.4b): the printed P/T, or what a characteristic-defining
// ability or an effect that *sets* P/T made it, before counters and every
// "+N/+N" — the rulings, all three. A 2/2 with a +1/+1 counter still counts;
// a 1/1 pumped to 2/2 doesn't; a Tarmogoyf whose CDA counts to 2/3 doesn't.
//
// - The draw counts as the trigger resolves, a token stack as every token in
//   it. Duskana, a 5/5, doesn't count itself.
// - The attack trigger checks the creature as it attacks; the +3/+3 then goes
//   on it whatever its base P/T is by the time the trigger resolves.
const TWO_TWO = {
  basePower: { op: "eq", n: 2 },
  baseToughness: { op: "eq", n: 2 },
} as const;

const ENTER_TEXT =
  "When Duskana enters, draw a card for each creature you control with base power and " +
  "toughness 2/2.";
const ATTACK_TEXT =
  "Whenever a creature you control with base power and toughness 2/2 attacks, it gets +3/+3 " +
  "until end of turn.";

export default defineCard({
  name: "Duskana, the Rage Mother",
  manaCost: "{2}{R}{G}{W}",
  colors: ["W", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bear"],
  power: 5,
  toughness: 5,
  text: `${ENTER_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "draw",
        amount: { countOf: { type: "creature", controlledBy: "you", ...TWO_TWO } },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "attacks", who: "you-control", filter: TWO_TWO },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "trigger-object",
        power: 3,
        toughness: 3,
        duration: "end-of-turn",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
