import { defineCard } from "../define.js";

export default defineCard({
  name: "Akoum Teeth",
  art: "https://cards.scryfall.io/art_crop/back/d/8/d8ed0335-daa6-4dbe-a94d-4d56c8cfd093.jpg",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Akoum Warrior", "Akoum Teeth"],
});
