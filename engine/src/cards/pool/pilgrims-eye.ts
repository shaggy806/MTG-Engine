import { defineCard } from "../define.js";

export default defineCard({
  name: "Pilgrim's Eye",
  manaCost: "{3}",
  types: ["artifact", "creature"],
  subtypes: ["Thopter"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "When Pilgrim's Eye enters, you may search your library for a basic land " +
    "card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "hand",
        min: 0,
        max: 1,
      },
      resolve: null,
      text:
        "When Pilgrim's Eye enters, you may search your library for a basic land " +
        "card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
