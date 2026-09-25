import { defineCard } from "../define.js";

export default defineCard({
  name: "Cloudheath Drake",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Drake"],
  power: 3,
  toughness: 3,
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
