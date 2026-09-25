import { defineCard } from "../define.js";

export default defineCard({
  name: "Fetid Imp",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Imp"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{B}: This creature gains deathtouch until end of turn. (Any amount of damage it deals to a creature is enough to destroy it.)",
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
