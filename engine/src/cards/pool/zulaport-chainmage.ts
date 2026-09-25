import { defineCard } from "../define.js";

export default defineCard({
  name: "Zulaport Chainmage",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Shaman", "Ally"],
  power: 4,
  toughness: 2,
  text: "Cohort — {T}, Tap an untapped Ally you control: Target opponent loses 2 life.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 1, filter: { subtype: "Ally", controlledBy: "you" } },
      },
      targets: ["opponent"],
      effect: { kind: "lose-life", amount: 2, target: 0 },
      resolve: null,
      text: "Cohort — {T}, Tap an untapped Ally you control: Target opponent loses 2 life.",
    },
  ],
});
