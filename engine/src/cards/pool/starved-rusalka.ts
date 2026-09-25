import { defineCard } from "../define.js";

export default defineCard({
  name: "Starved Rusalka",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "{G}, Sacrifice a creature: You gain 1 life.",
  activated: [
    {
      cost: { mana: "{G}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{G}, Sacrifice a creature: You gain 1 life.",
    },
  ],
});
