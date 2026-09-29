import { defineCard } from "../define.js";

export default defineCard({
  name: "Burnwillow Clearing",
  art: "https://cards.scryfall.io/art_crop/back/4/9/49974246-0a3b-4ec9-b5ea-2a89df9bb0b5.jpg",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {R} or {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {G}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Stump Stomp", "Burnwillow Clearing"],
});
