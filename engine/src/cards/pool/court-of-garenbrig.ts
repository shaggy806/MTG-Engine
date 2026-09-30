import { defineCard } from "../define.js";

const ENTER_TEXT = "When this enchantment enters, you become the monarch.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, distribute two +1/+1 counters among up to two target creatures. Then if you're the monarch, double the number of +1/+1 counters on each creature you control.";

// Two counters among up to two targets, at least one each: two on one, or
// one on each. A target found illegal loses its share rather than passing it
// on, so the split follows which targets were *chosen*. With none chosen,
// the doubling still happens.
export default defineCard({
  name: "Court of Garenbrig",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${UPKEEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [
        { kind: "optional", of: "creature" },
        { kind: "optional", of: { kind: "other", of: "creature", than: { slot: 0 } } },
      ],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "conditional",
            condition: { kind: "target-chosen", index: 0 },
            then: {
              kind: "conditional",
              condition: { kind: "target-chosen", index: 1 },
              then: {
                kind: "sequence",
                effects: [
                  { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
                  { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
                ],
              },
              else: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
            },
            else: {
              kind: "conditional",
              condition: { kind: "target-chosen", index: 1 },
              then: { kind: "add-counter", target: 1, counter: "+1/+1", amount: 2 },
            },
          },
          {
            kind: "conditional",
            condition: { kind: "monarch", who: "you" },
            then: {
              kind: "double-counters-all",
              filter: { type: "creature", controlledBy: "you" },
              counterKind: "+1/+1",
            },
          },
        ],
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
