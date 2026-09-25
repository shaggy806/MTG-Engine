import { defineCard } from "../define.js";

export default defineCard({
  name: "Vastwood Thicket",
  art: "https://cards.scryfall.io/art_crop/back/3/a/3a7fd24e-84d8-405d-86e4-0571a9e23cc2.jpg",
  colors: [],
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
  faces: ["Vastwood Fortification", "Vastwood Thicket"],
});
