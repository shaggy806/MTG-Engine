import { defineCard } from "../define.js";


export default defineCard({
  name: "Song-Mad Ruins",
  art: "https://cards.scryfall.io/art_crop/back/7/8/782ca27f-9f18-476c-b582-89c06fb2e322.jpg",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Song-Mad Treachery", "Song-Mad Ruins"],
});
