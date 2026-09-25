import { defineCard } from "../define.js";

export default defineCard({
  name: "Leaping Master",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 2,
  toughness: 1,
  text: "{2}{W}: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{2}{W}: This creature gains flying until end of turn.",
    },
  ],
});
