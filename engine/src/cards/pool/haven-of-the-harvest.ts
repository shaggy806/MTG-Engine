import { defineCard } from "../define.js";

export default defineCard({
  name: "Haven of the Harvest",
  art: "https://cards.scryfall.io/art_crop/back/a/7/a7143aa7-b16d-4e63-910c-6ceec55483f3.jpg",
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {G} or {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {W}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Strength of the Harvest", "Haven of the Harvest"],
});
