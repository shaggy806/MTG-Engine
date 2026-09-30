import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, you may search your library for a creature card with mana value 6 or greater, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Fierce Empath",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search for a creature card with mana value 6 or greater?",
        effect: {
          kind: "search-library",
          filter: { type: "creature", manaValue: { op: "gte", n: 6 } },
          destination: "hand",
          reveal: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
