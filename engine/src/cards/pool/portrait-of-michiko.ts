import { defineCard } from "../define.js";

// The back face of Michiko's Reign of Truth.
export default defineCard({
  name: "Portrait of Michiko",
  art: "https://cards.scryfall.io/art_crop/back/7/4/74f12c23-5c15-4ae6-8f4d-c5e6c1878817.jpg",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Human", "Noble"],
  power: 0,
  toughness: 0,
  text: "This creature gets +1/+1 for each artifact and/or enchantment you control.",
  faces: ["Michiko's Reign of Truth", "Portrait of Michiko"],
  transform: true,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: {
        filter: { typesAnyOf: ["artifact", "enchantment"], controlledBy: "you" },
        pt: [1, 1],
      },
      text: "This creature gets +1/+1 for each artifact and/or enchantment you control.",
    },
  ],
});
