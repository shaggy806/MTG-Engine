import { defineCard } from "../define.js";

export default defineCard({
  name: "Hooded Kavu",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Kavu"],
  power: 2,
  toughness: 2,
  text: "{B}: This creature gains fear until end of turn. (It can't be blocked except by artifact creatures and/or black creatures.)",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "fear", duration: "end-of-turn" },
      resolve: null,
      text: "{B}: This creature gains fear until end of turn.",
    },
  ],
});
