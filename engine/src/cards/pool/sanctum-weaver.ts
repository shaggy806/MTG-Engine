import { defineCard } from "../define.js";

// X mana of one colour, all of it the same, counted as it's made.
const TEXT = "{T}: Add X mana of any one color, where X is the number of enchantments you control.";

export default defineCard({
  name: "Sanctum Weaver",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Dryad"],
  power: 0,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["W", "U", "B", "R", "G"], same: true },
        amount: { countOf: { type: "enchantment", controlledBy: "you" } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
