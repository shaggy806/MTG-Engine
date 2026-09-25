import { defineCard } from "../define.js";

export default defineCard({
  name: "Malakir Mire",
  art: "https://cards.scryfall.io/art_crop/back/6/0/609d3ecf-f88d-4268-a8d3-4bf2bcf5df60.jpg",
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Malakir Rebirth", "Malakir Mire"],
});
