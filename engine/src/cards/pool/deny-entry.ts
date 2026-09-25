import { defineCard } from "../define.js";

export default defineCard({
  name: "Deny Entry",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target creature spell. Draw a card, then discard a card.",
  targets: ["creature-spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
    ],
  },
});
