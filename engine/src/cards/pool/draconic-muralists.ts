import { defineCard } from "../define.js";

export default defineCard({
  name: "Draconic Muralists",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dragon", "Bard"],
  power: 4,
  toughness: 3,
  text: "When this creature dies, you may search your library for a Dragon card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Dragon" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this creature dies, you may search your library for a Dragon card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
