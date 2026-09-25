import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightning Wolf",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 4,
  toughness: 3,
  text: "{1}{R}: This creature gains first strike until end of turn. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{R}: This creature gains first strike until end of turn. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
