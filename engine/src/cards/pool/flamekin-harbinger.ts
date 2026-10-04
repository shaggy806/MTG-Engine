import { defineCard } from "../define.js";

// EDHREC rank 6376.

const TRIGGER_TEXT =
  "When this creature enters, you may search your library for an Elemental card, reveal it, then shuffle and put that card on top.";

export default defineCard({
  name: "Flamekin Harbinger",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Shaman"],
  power: 1,
  toughness: 1,
  text: TRIGGER_TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for an Elemental card?",
        effect: {
          kind: "search-library",
          filter: { subtype: "Elemental" },
          destination: "library-top",
          reveal: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
