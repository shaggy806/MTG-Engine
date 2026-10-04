import { defineCard } from "../define.js";

// EDHREC rank 4335.

export default defineCard({
  name: "Mothdust Changeling",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 1,
  toughness: 1,
  keywords: ["changeling"],
  text: "Changeling (This card is every creature type.)\nTap an untapped creature you control: This creature gains flying until end of turn.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Tap an untapped creature you control: This creature gains flying until end of turn.",
    },
  ],
});
