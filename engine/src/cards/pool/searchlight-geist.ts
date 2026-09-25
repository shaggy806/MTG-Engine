import { defineCard } from "../define.js";

export default defineCard({
  name: "Searchlight Geist",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{3}{B}: This creature gains deathtouch until end of turn. (Any amount of damage it deals to a creature is enough to destroy it.)",
  activated: [
    {
      cost: { mana: "{3}{B}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{3}{B}: This creature gains deathtouch until end of turn.",
    },
  ],
});
