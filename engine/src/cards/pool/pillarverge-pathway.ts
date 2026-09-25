import { defineCard } from "../define.js";

export default defineCard({
  name: "Pillarverge Pathway",
  art: "https://cards.scryfall.io/art_crop/back/6/5/6559047e-6ede-4815-a3a0-389062094f9d.jpg",
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
  faces: ["Needleverge Pathway", "Pillarverge Pathway"],
});
