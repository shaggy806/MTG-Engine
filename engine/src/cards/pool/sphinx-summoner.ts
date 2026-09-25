import { defineCard } from "../define.js";

export default defineCard({
  name: "Sphinx Summoner",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  types: ["artifact", "creature"],
  subtypes: ["Sphinx"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, you may search your library for an artifact creature card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { types: ["artifact", "creature"] },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this creature enters, you may search your library for an artifact creature card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
