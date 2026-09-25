import { defineCard } from "../define.js";

export default defineCard({
  name: "Thalia's Lancers",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 4,
  toughness: 4,
  keywords: ["first-strike"],
  text: "First strike\nWhen this creature enters, you may search your library for a legendary card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "legendary" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this creature enters, you may search your library for a legendary card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
