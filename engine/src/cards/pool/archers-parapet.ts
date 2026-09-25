import { defineCard } from "../define.js";

export default defineCard({
  name: "Archers' Parapet",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 5,
  keywords: ["defender"],
  text: "Defender\n{1}{B}, {T}: Each opponent loses 1 life.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: true },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "{1}{B}, {T}: Each opponent loses 1 life.",
    },
  ],
});
