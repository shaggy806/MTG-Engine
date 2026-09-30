import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, you may search your library for a Goblin card, reveal that card, put it into your hand, then shuffle.";

export default defineCard({
  name: "Goblin Matron",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a Goblin card?",
        effect: {
          kind: "search-library",
          filter: { subtype: "Goblin" },
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
