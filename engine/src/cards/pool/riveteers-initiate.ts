import { defineCard } from "../define.js";

export default defineCard({
  name: "Riveteers Initiate",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Citizen"],
  power: 2,
  toughness: 2,
  text: "{1}{B/G}: This creature gains deathtouch until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{B/G}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{B/G}: This creature gains deathtouch until end of turn.",
    },
  ],
});
