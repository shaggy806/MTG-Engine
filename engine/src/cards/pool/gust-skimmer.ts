import { defineCard } from "../define.js";

export default defineCard({
  name: "Gust-Skimmer",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Insect"],
  power: 2,
  toughness: 1,
  text: "{U}: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gains flying until end of turn.",
    },
  ],
});
