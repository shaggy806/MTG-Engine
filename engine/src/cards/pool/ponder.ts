import { defineCard } from "../define.js";

// The three go back on top in the order they're picked (the first picked on
// top), then the optional shuffle — which includes them (the ruling) — then
// the draw.
export default defineCard({
  name: "Ponder",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Look at the top three cards of your library, then put them back in any order. You may shuffle.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "look-and-choose",
        zone: "library",
        count: 3,
        min: 3,
        max: 3,
        destination: "library-top",
        leftover: "stay",
      },
      { kind: "may", prompt: "Shuffle your library?", effect: { kind: "shuffle-library" } },
      { kind: "draw", amount: 1 },
    ],
  },
});
