import { defineCard } from "../define.js";

// The back face of The Restoration of Eiganjo.
export default defineCard({
  name: "Architect of Restoration",
  art: "https://cards.scryfall.io/art_crop/back/a/1/a11a33ae-e7fa-4bd4-8cd8-3a3239a29bcc.jpg",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Fox", "Monk"],
  power: 3,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance\nWhenever this creature attacks or blocks, create a 1/1 colorless Spirit creature token.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token (Colorless)", count: 1 },
      resolve: null,
      text: "Whenever this creature attacks or blocks, create a 1/1 colorless Spirit creature token.",
    },
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token (Colorless)", count: 1 },
      resolve: null,
      text: "Whenever this creature attacks or blocks, create a 1/1 colorless Spirit creature token.",
    },
  ],
  faces: ["The Restoration of Eiganjo", "Architect of Restoration"],
  transform: true,
});
