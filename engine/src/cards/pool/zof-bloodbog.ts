import { defineCard } from "../define.js";

export default defineCard({
  name: "Zof Bloodbog",
  art: "https://cards.scryfall.io/art_crop/back/9/8/98496d5b-1519-4f0c-8b46-0a43be643dfb.jpg",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Zof Consumption", "Zof Bloodbog"],
});
