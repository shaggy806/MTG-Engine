import { defineCard } from "../define.js";

export default defineCard({
  name: "Rune-Scarred Demon",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, search your library for a card, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "search-library", filter: {}, destination: "hand", min: 0, max: 1 },
      resolve: null,
      text: "When this creature enters, search your library for a card, put it into your hand, then shuffle.",
    },
  ],
});
