import { defineCard } from "../define.js";

export default defineCard({
  name: "Lost in the Mist",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell. Return target permanent to its owner's hand.",
  targets: ["spell", "permanent"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "counter", target: 0 }, { kind: "return-to-hand", target: 1 }],
  },
});
