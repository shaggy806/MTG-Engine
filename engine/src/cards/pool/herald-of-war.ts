import { defineCard } from "../define.js";

// EDHREC rank 3146.
//
// Rulings:
//   [2012-05-01] The cost reduction is based on the total number of +1/+1 counters on Herald of
//     War, not just the ones put on it by its own ability.
//   [2012-05-01] A creature spell that's both an Angel and a Human will cost {1} less to cast for
//     each +1/+1 counter on Herald of War. (One `anyOf` filter: matching both counts once.)

const ATTACK_TEXT = "Whenever this creature attacks, put a +1/+1 counter on it.";
const COST_TEXT =
  "Angel spells and Human spells you cast cost {1} less to cast for each +1/+1 counter on this creature.";

export default defineCard({
  name: "Herald of War",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${ATTACK_TEXT}\n${COST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { anyOf: [{ subtype: "Angel" }, { subtype: "Human" }] },
        caster: "you",
        reduceGeneric: { countersOnSource: "+1/+1" },
      },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
