import { defineCard } from "../define.js";

export default defineCard({
  name: "Jwari Ruins",
  art: "https://cards.scryfall.io/art_crop/back/3/0/301750a7-d1fd-435e-bfa8-9d2fb22ad627.jpg",
  colors: [],
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
  faces: ["Jwari Disruption", "Jwari Ruins"],
});
