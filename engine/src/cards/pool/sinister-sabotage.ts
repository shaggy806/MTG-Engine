import { defineCard } from "../define.js";

export default defineCard({
  name: "Sinister Sabotage",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell.\nSurveil 1.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "surveil", amount: 1 },
    ],
  },
});
