import { defineCard } from "../define.js";

// Kabira Takedown's back face (modal double-faced).

export default defineCard({
  name: "Kabira Plateau",
  art: "https://cards.scryfall.io/art_crop/back/3/6/366e9845-019d-47cc-adb8-8fbbaad35b6d.jpg",
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
  faces: ["Kabira Takedown", "Kabira Plateau"],
});
