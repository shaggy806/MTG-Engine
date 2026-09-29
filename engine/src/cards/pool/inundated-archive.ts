import { defineCard } from "../define.js";

export default defineCard({
  name: "Inundated Archive",
  art: "https://cards.scryfall.io/art_crop/back/0/6/060f9675-4921-4cbb-bae2-54c85c679fd4.jpg",
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {U} or {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {B}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Waterlogged Teachings", "Inundated Archive"],
});
