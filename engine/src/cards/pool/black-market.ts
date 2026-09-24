import { defineCard } from "../define.js";

// "Your first main phase" is the precombat main phase — an additional main
// phase after an extra combat is never the first.
export default defineCard({
  name: "Black Market",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text:
    "Whenever a creature dies, put a charge counter on this enchantment.\n" +
    "At the beginning of your first main phase, add {B} for each charge counter on this enchantment.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
      resolve: null,
      text: "Whenever a creature dies, put a charge counter on this enchantment.",
    },
    {
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "B",
        amount: { countersOn: "source", counter: "charge" },
      },
      resolve: null,
      text:
        "At the beginning of your first main phase, add {B} for each charge counter on this enchantment.",
    },
  ],
});
