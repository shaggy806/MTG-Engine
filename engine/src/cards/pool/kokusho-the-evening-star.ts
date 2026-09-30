import { defineCard } from "../define.js";

const TEXT = "When Kokusho dies, each opponent loses 5 life. You gain life equal to the life lost this way.";

export default defineCard({
  name: "Kokusho, the Evening Star",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Spirit"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 5, who: "each-opponent" },
          // What the opponents actually lost.
          { kind: "gain-life", amount: { lifeLostThisWay: true, who: "each-opponent" } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
