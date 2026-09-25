import { defineCard } from "../define.js";

export default defineCard({
  name: "Corpse Knight",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Zombie", "Knight"],
  power: 2,
  toughness: 2,
  text: "Whenever another creature you control enters, each opponent loses 1 life.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever another creature you control enters, each opponent loses 1 life.",
    },
  ],
});
