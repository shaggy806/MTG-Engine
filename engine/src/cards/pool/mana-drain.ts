import { defineCard } from "../define.js";

export default defineCard({
  name: "Mana Drain",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Counter target spell. At the beginning of your next main phase, add an amount of {C} equal " +
    "to that spell's mana value.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      {
        // "That spell's mana value" is read as the spell last existed on the
        // stack, so it includes the X it was cast with (rule 202.3e). A spell
        // that couldn't be countered still pays out (2020-11-10 ruling).
        kind: "delayed-trigger",
        at: "your-next-main-phase",
        effect: { kind: "add-mana", mana: "C", amount: { manaValueOf: 0 } },
        text: "Add an amount of {C} equal to the countered spell's mana value.",
      },
    ],
  },
});
