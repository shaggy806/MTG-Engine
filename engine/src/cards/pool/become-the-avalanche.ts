import { defineCard } from "../define.js";

const HAND = { cardsInHand: "you" } as const;

// X is the hand as the second sentence applies — after the draw (rule
// 608.2h).
export default defineCard({
  name: "Become the Avalanche",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Draw a card for each creature you control with power 4 or greater. Then creatures you control get +X/+X until end of turn, where X is the number of cards in your hand.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: { countOf: { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } } } },
      {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: HAND,
        toughness: HAND,
        duration: "end-of-turn",
      },
    ],
  },
});
