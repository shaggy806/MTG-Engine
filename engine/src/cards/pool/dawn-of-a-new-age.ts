import { defineCard } from "../define.js";

// EDHREC rank 4148.

// "Remove a hope counter. If you do, draw" — a counter can be removed exactly
// when this enchantment is still the same permanent and has one. The "then if
// it has no hope counters" check reads it as it last existed if it has left
// (rule 608.2h); the life is gained whether or not the sacrifice happens.
const ENTER_TEXT = "This enchantment enters with a hope counter on it for each creature you control.";
const END_TEXT =
  "At the beginning of your end step, remove a hope counter from this enchantment. If you do, draw a card. Then if this enchantment has no hope counters on it, sacrifice it and you gain 4 life.";

export default defineCard({
  name: "Dawn of a New Age",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${END_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "hope", amount: { countOf: { type: "creature", controlledBy: "you" } } },
      },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "conditional",
            condition: {
              kind: "all",
              of: [
                { kind: "source-on-battlefield" },
                { kind: "self-counters", counter: "hope", compare: { op: "gte", n: 1 } },
              ],
            },
            then: {
              kind: "sequence",
              effects: [
                { kind: "remove-counter", target: "source", counter: "hope", amount: 1 },
                { kind: "draw", amount: 1 },
              ],
            },
          },
          {
            kind: "conditional",
            condition: { kind: "self-counters", counter: "hope", compare: { op: "eq", n: 0 } },
            then: {
              kind: "sequence",
              effects: [{ kind: "sacrifice-source" }, { kind: "gain-life", amount: 4 }],
            },
          },
        ],
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
