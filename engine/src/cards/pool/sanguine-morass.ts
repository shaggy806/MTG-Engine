import { defineCard } from "../define.js";

// The land back face of Bloodsoaked Insight (a modal double-faced card).

export default defineCard({
  name: "Sanguine Morass",
  art: "https://cards.scryfall.io/art_crop/back/0/a/0a08e0d2-1e60-47f5-9228-4c11a127089d.jpg",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {B} or {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {R}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Bloodsoaked Insight", "Sanguine Morass"],
});
