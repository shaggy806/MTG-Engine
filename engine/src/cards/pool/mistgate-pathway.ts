import { defineCard } from "../define.js";

export default defineCard({
  name: "Mistgate Pathway",
  art: "https://cards.scryfall.io/art_crop/back/7/e/7ef37cb3-d803-47d7-8a01-9c803aa2eadc.jpg",
  colors: [],
  types: ["land"],
  text: "{T}: Add {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
  ],
  faces: ["Hengegate Pathway", "Mistgate Pathway"],
});
