import { defineCard } from "../define.js";

export default defineCard({
  name: "Shamanic Revelation",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Draw a card for each creature you control.\n" +
    "Ferocious — You gain 4 life for each creature you control with power 4 or greater.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: { countOf: { type: "creature", controlledBy: "you" } } },
      {
        kind: "gain-life",
        amount: {
          countOf: { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } },
          times: 4,
        },
      },
    ],
  },
});
