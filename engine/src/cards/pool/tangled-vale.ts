import { defineCard } from "../define.js";

export default defineCard({
  name: "Tangled Vale",
  art: "https://cards.scryfall.io/art_crop/back/2/3/235d1ffc-72aa-40a2-95dc-3f6a8d495061.jpg",
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
  faces: ["Tangled Florahedron", "Tangled Vale"],
});
