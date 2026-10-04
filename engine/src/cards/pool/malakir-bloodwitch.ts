import { defineCard } from "../define.js";

// EDHREC rank 3553.

const ETB_TEXT =
  "When this creature enters, each opponent loses life equal to the number of Vampires you control. You gain life equal to the life lost this way.";

export default defineCard({
  name: "Malakir Bloodwitch",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Shaman"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying, protection from white\n${ETB_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Gray Merchant's shape: what the opponents actually lost.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: { countOf: { subtype: "Vampire", controlledBy: "you" } }, who: "each-opponent" },
          { kind: "gain-life", amount: { lifeLostThisWay: true, who: "each-opponent" } },
        ],
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      protection: { colors: ["W"] },
      text: "Protection from white",
    },
  ],
});
