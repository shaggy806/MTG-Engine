import { defineCard } from "../define.js";

export default defineCard({
  name: "Myr Kinsmith",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 3,
  toughness: 1,
  text: "When this creature enters, you may search your library for a Myr card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Myr" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this creature enters, you may search your library for a Myr card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
