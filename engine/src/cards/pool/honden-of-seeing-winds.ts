import { defineCard } from "../define.js";

// EDHREC rank 5287.

const TEXT = "At the beginning of your upkeep, draw a card for each Shrine you control.";

// Sanctum of Stone Fangs' Shrine count, itself included, read as it resolves.
export default defineCard({
  name: "Honden of Seeing Winds",
  manaCost: "{4}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "draw",
        amount: { countOf: { type: "enchantment", subtype: "Shrine", controlledBy: "you" } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
