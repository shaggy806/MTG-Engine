import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, you may search your library for an instant or sorcery card with mana value 2 or less, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Spellseeker",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for an instant or sorcery card with mana value 2 or less?",
        effect: {
          kind: "search-library",
          filter: { typesAnyOf: ["instant", "sorcery"], manaValue: { op: "lte", n: 2 } },
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
