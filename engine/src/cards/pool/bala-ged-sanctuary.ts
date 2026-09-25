import { defineCard } from "../define.js";

export default defineCard({
  name: "Bala Ged Sanctuary",
  art: "https://cards.scryfall.io/art_crop/back/c/5/c5cb3052-358d-44a7-8cfd-cd31b236494a.jpg",
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Bala Ged Recovery", "Bala Ged Sanctuary"],
});
