import { defineCard } from "../define.js";

export default defineCard({
  name: "Slitherbore Pathway",
  art: "https://cards.scryfall.io/art_crop/back/8/7/87a4e5fe-161f-42da-9ca2-67c8e8970e94.jpg",
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
  faces: ["Darkbore Pathway", "Slitherbore Pathway"],
});
