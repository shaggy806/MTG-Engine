import { defineCard } from "../define.js";

export default defineCard({
  name: "Khalni Territory",
  art: "https://cards.scryfall.io/art_crop/back/9/9/99535539-aa73-41ed-86ab-21c97b92620d.jpg",
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
  faces: ["Khalni Ambush", "Khalni Territory"],
});
