import { defineCard } from "../define.js";

export default defineCard({
  name: "Imperial Recruiter",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 1,
  toughness: 1,
  text:
    "When this creature enters, search your library for a creature card with power 2 or less, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "creature", power: { op: "lte", n: 2 } },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text:
        "When this creature enters, search your library for a creature card with power 2 or less, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
