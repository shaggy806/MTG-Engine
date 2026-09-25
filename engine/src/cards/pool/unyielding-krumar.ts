import { defineCard } from "../define.js";

export default defineCard({
  name: "Unyielding Krumar",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Orc", "Warrior"],
  power: 3,
  toughness: 3,
  text: "{1}{W}: This creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{W}: This creature gains first strike until end of turn.",
    },
  ],
});
