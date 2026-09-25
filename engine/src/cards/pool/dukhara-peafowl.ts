import { defineCard } from "../define.js";

export default defineCard({
  name: "Dukhara Peafowl",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 4,
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
