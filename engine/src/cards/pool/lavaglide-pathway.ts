import { defineCard } from "../define.js";

export default defineCard({
  name: "Lavaglide Pathway",
  art: "https://cards.scryfall.io/art_crop/back/2/6/2668ac91-6cda-4f81-a08d-4fc5f9cb35b2.jpg",
  colors: [],
  types: ["land"],
  text: "{T}: Add {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
  ],
  faces: ["Riverglide Pathway", "Lavaglide Pathway"],
});
