import { defineCard } from "../define.js";

export default defineCard({
  name: "Fallaji Chaindancer",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 4,
  text: "{2}: This creature gains double strike until end of turn.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "double-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}: This creature gains double strike until end of turn.",
    },
  ],
});
