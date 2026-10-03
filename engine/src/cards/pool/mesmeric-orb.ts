import { defineCard } from "../define.js";

// Once per permanent that untaps — an untap step's many included, whose
// triggers wait for the upkeep and go on the stack with its own (its ruling).
// "That permanent's controller" is the trigger object's, as it last was on
// the battlefield if it has left since.
const TEXT = "Whenever a permanent becomes untapped, that permanent's controller mills a card.";

export default defineCard({
  name: "Mesmeric Orb",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "becomes-untapped", who: "any" },
      targets: [],
      effect: { kind: "mill", target: "trigger-controller", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
