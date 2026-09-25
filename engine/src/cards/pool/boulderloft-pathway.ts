import { defineCard } from "../define.js";

export default defineCard({
  name: "Boulderloft Pathway",
  art: "https://cards.scryfall.io/art_crop/back/0/5/0511e232-2a72-40f5-a400-4f7ebc442d17.jpg",
  colors: [],
  types: ["land"],
  text: "{T}: Add {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
  ],
  faces: ["Branchloft Pathway", "Boulderloft Pathway"],
});
