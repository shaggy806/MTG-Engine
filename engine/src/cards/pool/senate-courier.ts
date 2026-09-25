import { defineCard } from "../define.js";

export default defineCard({
  name: "Senate Courier",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\n{1}{W}: This creature gains vigilance until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "vigilance",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{W}: This creature gains vigilance until end of turn.",
    },
  ],
});
