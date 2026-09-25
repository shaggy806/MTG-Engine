import { defineCard } from "../define.js";

export default defineCard({
  name: "Emerald Dragonfly",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{G}{G}: This creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{G}{G}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{G}{G}: This creature gains first strike until end of turn.",
    },
  ],
});
