import { defineCard } from "../define.js";

export default defineCard({
  name: "Pestilent Wolf",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 2,
  toughness: 2,
  text: "{2}{G}: This creature gains deathtouch until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{G}: This creature gains deathtouch until end of turn.",
    },
  ],
});
