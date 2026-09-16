import { defineCard } from "../define.js";

export default defineCard({
  name: "Mire Triton",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Merfolk"],
  power: 2,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhen Mire Triton enters, mill two cards and you gain 2 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 2 },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: "When Mire Triton enters, mill two cards and you gain 2 life.",
    },
  ],
});
