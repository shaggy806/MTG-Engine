import { defineCard } from "../define.js";

export default defineCard({
  name: "Gutless Ghoul",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["snow"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: "{1}, Sacrifice a creature: You gain 2 life.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "{1}, Sacrifice a creature: You gain 2 life.",
    },
  ],
});
