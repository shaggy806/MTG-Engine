import { defineCard } from "../define.js";

// EDHREC rank 6611.
// Elvish Harbinger's shape: a "Faerie card" is any card with the Faerie
// subtype (a Kindred Faerie included), and declining the search leaves the
// library unshuffled.

const TRIGGER_TEXT =
  "When this creature enters, you may search your library for a Faerie card, reveal it, then shuffle and put that card on top.";

export default defineCard({
  name: "Faerie Harbinger",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a Faerie card?",
        effect: {
          kind: "search-library",
          filter: { subtype: "Faerie" },
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
