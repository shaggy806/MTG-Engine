import { defineCard } from "../define.js";

// EDHREC rank 4701.

// Goblin Ringleader's shape: `min` = `max` = 4 is clamped to the lands among
// the four, so every one is taken; the rest go to the graveyard.
export default defineCard({
  name: "Mulch",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Reveal the top four cards of your library. Put all land cards revealed this way into your hand and the rest into your graveyard.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 4,
    reveal: true,
    min: 4,
    max: 4,
    filter: { type: "land" },
    destination: "hand",
    leftover: "graveyard",
  },
});
