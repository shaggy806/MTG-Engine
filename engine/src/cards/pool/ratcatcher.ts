import { defineCard } from "../define.js";

export default defineCard({
  name: "Ratcatcher",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Ogre", "Rogue"],
  power: 4,
  toughness: 4,
  keywords: ["fear"],
  text: "Fear (This creature can't be blocked except by artifact creatures and/or black creatures.)\nAt the beginning of your upkeep, you may search your library for a Rat card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Rat" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "At the beginning of your upkeep, you may search your library for a Rat card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
