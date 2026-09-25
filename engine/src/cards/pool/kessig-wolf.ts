import { defineCard } from "../define.js";

export default defineCard({
  name: "Kessig Wolf",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 3,
  toughness: 1,
  text: "{1}{R}: This creature gains first strike until end of turn.",
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
      text: "{1}{R}: This creature gains first strike until end of turn.",
    },
  ],
});
