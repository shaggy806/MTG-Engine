import { defineCard } from "../define.js";

export default defineCard({
  name: "Fall of the Gavel",
  manaCost: "{3}{W}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: "Counter target spell. You gain 5 life.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "counter", target: 0 }, { kind: "gain-life", amount: 5 }],
  },
});
