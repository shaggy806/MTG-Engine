import { defineCard } from "../define.js";

// Top-commanders rank 44. The reduction counts Animar's +1/+1 counters as the
// cost is determined, so the counter a creature spell's own cast trigger adds
// only helps the next one (the 2018 ruling: the trigger resolves after costs
// are paid). The cast trigger is `otherOnly` — the spell being cast is in the
// trigger scan, and Animar's own cast mustn't put a counter on the card on
// the stack.
export default defineCard({
  name: "Animar, Soul of Elements",
  manaCost: "{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 1,
  toughness: 1,
  text:
    "Protection from white and from black\n" +
    "Whenever you cast a creature spell, put a +1/+1 counter on Animar.\n" +
    "Creature spells you cast cost {1} less to cast for each +1/+1 counter on Animar.",
  static: [
    {
      affects: { scope: "self" },
      protection: { colors: ["W", "B"] },
      text: "Protection from white and from black",
    },
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", controlledBy: "you" },
        reduceGeneric: { countersOnSource: "+1/+1" },
      },
      text: "Creature spells you cast cost {1} less to cast for each +1/+1 counter on Animar.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you cast a creature spell, put a +1/+1 counter on Animar.",
    },
  ],
});
