import { defineCard } from "../define.js";

export default defineCard({
  name: "Ondu Skyruins",
  art: "https://cards.scryfall.io/art_crop/back/b/6/b6e6be8c-41c3-4348-a8dd-b40ceb24e9b4.jpg",
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
  faces: ["Ondu Inversion", "Ondu Skyruins"],
});
