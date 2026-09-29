import { defineCard } from "../define.js";

export default defineCard({
  name: "Legion Stronghold",
  art: "https://cards.scryfall.io/art_crop/back/7/6/7676abd9-0a3d-4721-b17b-778d2e3c2e25.jpg",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {R} or {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {W}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Legion Leadership", "Legion Stronghold"],
});
