import { defineCard } from "../define.js";

export default defineCard({
  name: "Sangromancer",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Shaman"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever a creature an opponent controls dies, you may gain 3 life.\n" +
    "Whenever an opponent discards a card, you may gain 3 life.",
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "any",
        filter: { type: "creature", controlledBy: "opponent" },
      },
      targets: [],
      effect: { kind: "may", prompt: "Gain 3 life?", effect: { kind: "gain-life", amount: 3 } },
      resolve: null,
      text: "Whenever a creature an opponent controls dies, you may gain 3 life.",
    },
    {
      // Once per card discarded, not once per discard.
      trigger: { on: "discards", who: "opponent", perCard: true },
      targets: [],
      effect: { kind: "may", prompt: "Gain 3 life?", effect: { kind: "gain-life", amount: 3 } },
      resolve: null,
      text: "Whenever an opponent discards a card, you may gain 3 life.",
    },
  ],
});
