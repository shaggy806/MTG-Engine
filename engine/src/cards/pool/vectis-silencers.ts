import { defineCard } from "../define.js";

export default defineCard({
  name: "Vectis Silencers",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Human", "Rogue"],
  power: 1,
  toughness: 2,
  text: "{2}{B}: This creature gains deathtouch until end of turn. (Any amount of damage it deals to a creature is enough to destroy that creature.)",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{B}: This creature gains deathtouch until end of turn.",
    },
  ],
});
