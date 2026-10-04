import { defineCard } from "../define.js";

// EDHREC rank 5714.

export default defineCard({
  name: "Mindslicer",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 4,
  toughness: 3,
  text: "When this creature dies, each player discards their hand.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "discard-hand", who: "each-player" },
      resolve: null,
      text: "When this creature dies, each player discards their hand.",
    },
  ],
});
