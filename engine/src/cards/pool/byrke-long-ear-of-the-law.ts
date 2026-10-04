import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 5964.
//
// Rulings:
//   [2024-07-26] To double the number of +1/+1 counters on a creature, put a number of +1/+1
//     counters on it equal to the number it already has. Replacement effects that modify the
//     number of counters being placed on creatures you control, such as the effect of Branching
//     Evolution, apply to this ability as normal.
//
// Rishkar's "each of up to two target creatures"; the attack trigger fires for
// any creature you control (Byrke included) that has a +1/+1 counter as it's
// declared an attacker, and doubles that creature's +1/+1 counters (Big
// Mother Mouser's `double-counters`, put on as an `add-counter` would be).
const ETB_TEXT = "When Byrke enters, put a +1/+1 counter on each of up to two target creatures.";
const ATTACK_TEXT =
  "Whenever a creature you control with a +1/+1 counter on it attacks, double the number of +1/+1 counters on it.";

export default defineCard({
  name: "Byrke, Long Ear of the Law",
  manaCost: "{4}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rabbit", "Soldier"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance"],
  text: `Vigilance\n${ETB_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: distinctTargets(2, "creature", { optional: true }),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: {
        on: "attacks",
        who: "you-control",
        filter: { type: "creature", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      effect: { kind: "double-counters", target: "trigger-object", counter: "+1/+1" },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
