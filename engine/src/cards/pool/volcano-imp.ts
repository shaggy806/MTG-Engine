import { defineCard } from "../define.js";

export default defineCard({
  name: "Volcano Imp",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Imp"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{1}{R}: This creature gains first strike until end of turn.",
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
