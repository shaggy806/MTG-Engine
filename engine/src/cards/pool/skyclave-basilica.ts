import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyclave Basilica",
  art: "https://cards.scryfall.io/art_crop/back/0/1/014027c4-7f9d-4096-b308-ea4be574c0d4.jpg",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Skyclave Cleric", "Skyclave Basilica"],
});
