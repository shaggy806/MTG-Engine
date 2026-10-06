import { defineCard } from "../define.js";

// Foulmire Knight's Adventure.
export default defineCard({
  name: "Profane Insight",
  art: "https://cards.scryfall.io/art_crop/back/4/6/4676c019-886c-4b0d-9849-c044c0e03da3.jpg",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "You draw a card and you lose 1 life. (Then exile this card. You may cast the creature later from exile.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 1 },
      { kind: "lose-life", amount: 1 },
    ],
  },
  faces: ["Foulmire Knight", "Profane Insight"],
  adventure: true,
});
