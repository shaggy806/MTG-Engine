import { defineCard } from "../define.js";

export default defineCard({
  name: "Wayward Servant",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: "Whenever another Zombie you control enters, each opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Zombie" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever another Zombie you control enters, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
