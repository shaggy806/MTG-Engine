import { defineCard } from "../define.js";

export default defineCard({
  name: "Corpse Blockade",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender\nSacrifice another creature: This creature gains deathtouch until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Sacrifice another creature: This creature gains deathtouch until end of turn.",
      otherOnly: true,
    },
  ],
});
