import { defineCard } from "../define.js";

const CHARGE_TEXT =
  "Whenever you cast an instant or sorcery spell, if this artifact has fewer than three charge counters on it, put a charge counter on it.";
const COPY_TEXT =
  "Remove three charge counters from this artifact: When you next cast an instant or sorcery spell this turn, copy it and you may choose new targets for the copy.";

// The delayed trigger copies the next instant or sorcery whether or not it
// has targets, and the copy is made even if that spell was countered in
// response (the rulings) — from the spell as it last was on the stack.
export default defineCard({
  name: "Adaptive Training Post",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: `${CHARGE_TEXT}\n${COPY_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      condition: { kind: "self-counters", counter: "charge", compare: { op: "lt", n: 3 } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
      resolve: null,
      text: CHARGE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "charge", count: 3 } },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: { nextSpell: { typesAnyOf: ["instant", "sorcery"] } },
        effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
        text: "When you next cast an instant or sorcery spell this turn, copy it and you may choose new targets for the copy.",
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
