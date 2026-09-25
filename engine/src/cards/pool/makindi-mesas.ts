import { defineCard } from "../define.js";

export default defineCard({
  name: "Makindi Mesas",
  art: "https://cards.scryfall.io/art_crop/back/a/d/ada9a974-8f1f-4148-bd61-200fc14714b2.jpg",
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
  faces: ["Makindi Stampede", "Makindi Mesas"],
});
