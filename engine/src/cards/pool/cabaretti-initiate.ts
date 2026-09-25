import { defineCard } from "../define.js";

export default defineCard({
  name: "Cabaretti Initiate",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Raccoon", "Citizen"],
  power: 1,
  toughness: 2,
  text: "{2}{R/W}: This creature gains double strike until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{R/W}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "double-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{R/W}: This creature gains double strike until end of turn.",
    },
  ],
});
