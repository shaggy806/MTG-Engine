import { defineCard } from "../define.js";

export default defineCard({
  name: "Dross Hopper",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Insect", "Horror"],
  power: 2,
  toughness: 1,
  text: "Sacrifice a creature: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a creature: This creature gains flying until end of turn.",
    },
  ],
});
