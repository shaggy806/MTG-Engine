import { defineCard } from "../define.js";

const TEXT = "{2}{B}, {T}: Each opponent loses X life, where X is the number of creatures with defender you control.";

export default defineCard({
  name: "Blight Pile",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian"],
  power: 3,
  toughness: 3,
  keywords: ["defender"],
  text: `Defender\n${TEXT}`,
  activated: [
    {
      cost: { mana: "{2}{B}", tap: true },
      targets: [],
      effect: { kind: "lose-life", amount: { countOf: { type: "creature", controlledBy: "you", keyword: "defender" } }, who: "each-opponent" },
      resolve: null,
      text: TEXT,
    },
  ],
});
