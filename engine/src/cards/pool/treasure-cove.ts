import { defineCard } from "../define.js";

// The back face of Treasure Map.

export default defineCard({
  name: "Treasure Cove",
  art: "https://cards.scryfall.io/art_crop/back/a/9/a924fe1e-a85e-4e14-88d2-ac55130638ab.jpg",
  colors: [],
  types: ["land"],
  text: "(Transforms from Treasure Map.)\n{T}: Add {C}.\n{T}, Sacrifice a Treasure: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Treasure" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{T}, Sacrifice a Treasure: Draw a card.",
    },
  ],
  faces: ["Treasure Map", "Treasure Cove"],
  transform: true,
});
