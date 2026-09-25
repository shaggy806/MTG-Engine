import { defineCard } from "../define.js";

export default defineCard({
  name: "Battlefly Swarm",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{B}: This creature gains deathtouch until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{B}: This creature gains deathtouch until end of turn.",
    },
  ],
});
