import { defineCard } from "../define.js";

export default defineCard({
  name: "Valakut Stoneforge",
  art: "https://cards.scryfall.io/art_crop/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Valakut Awakening", "Valakut Stoneforge"],
});
