import { defineCard } from "../define.js";

export default defineCard({
  name: "Murkwater Pathway",
  art: "https://cards.scryfall.io/art_crop/back/b/4/b4b99ebb-0d54-4fe5-a495-979aaa564aa8.jpg",
  colors: [],
  types: ["land"],
  text: "{T}: Add {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
  ],
  faces: ["Clearwater Pathway", "Murkwater Pathway"],
});
