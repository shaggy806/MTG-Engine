import { defineCard } from "../define.js";

export default defineCard({
  name: "Silundi Isle",
  art: "https://cards.scryfall.io/art_crop/back/1/1/11568cdf-6148-494c-8b98-f5ca5797d775.jpg",
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Silundi Vision", "Silundi Isle"],
});
