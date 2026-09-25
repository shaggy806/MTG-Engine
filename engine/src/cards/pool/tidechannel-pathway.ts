import { defineCard } from "../define.js";

export default defineCard({
  name: "Tidechannel Pathway",
  art: "https://cards.scryfall.io/art_crop/back/b/6/b6de14ae-0132-4261-af00-630bf15918cd.jpg",
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
  faces: ["Barkchannel Pathway", "Tidechannel Pathway"],
});
