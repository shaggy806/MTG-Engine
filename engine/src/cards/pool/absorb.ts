import { defineCard } from "../define.js";

export default defineCard({
  name: "Absorb",
  manaCost: "{W}{U}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: "Counter target spell. You gain 3 life.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "gain-life", amount: 3 },
    ],
  },
});
