import { defineCard } from "../define.js";

export default defineCard({
  name: "Kazuul's Cliffs",
  art: "https://cards.scryfall.io/art_crop/back/7/5/75240bbc-adc7-48ff-9523-c79776d710d3.jpg",
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
  faces: ["Kazuul's Fury", "Kazuul's Cliffs"],
});
