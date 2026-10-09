import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, you may search your library for a creature card with toughness 2 or less, reveal it, put it into your hand, then shuffle.";

// A "*" toughness is read in the library too (the ruling — Nethergoyf).
export default defineCard({
  name: "Recruiter of the Guard",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a creature card with toughness 2 or less?",
        effect: {
          kind: "search-library",
          filter: { type: "creature", toughness: { op: "lte", n: 2 } },
          destination: "hand",
          min: 0,
          max: 1,
          reveal: true,
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
