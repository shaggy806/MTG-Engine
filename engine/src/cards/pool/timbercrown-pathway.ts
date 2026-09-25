import { defineCard } from "../define.js";

export default defineCard({
  name: "Timbercrown Pathway",
  art: "https://cards.scryfall.io/art_crop/back/d/a/da57eb54-5199-4a56-95f7-f6ac432876b1.jpg",
  colors: [],
  types: ["land"],
  text: "{T}: Add {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
  ],
  faces: ["Cragcrown Pathway", "Timbercrown Pathway"],
});
