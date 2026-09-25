import { defineCard } from "../define.js";

export default defineCard({
  name: "Death-Hood Cobra",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Snake"],
  power: 2,
  toughness: 2,
  text: "{1}{G}: This creature gains reach until end of turn.\n{1}{G}: This creature gains deathtouch until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "reach", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}: This creature gains reach until end of turn.",
    },
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{G}: This creature gains deathtouch until end of turn.",
    },
  ],
});
