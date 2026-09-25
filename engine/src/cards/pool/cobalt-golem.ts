import { defineCard } from "../define.js";

export default defineCard({
  name: "Cobalt Golem",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 2,
  toughness: 3,
  text: "{1}{U}: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{U}: This creature gains flying until end of turn.",
    },
  ],
});
