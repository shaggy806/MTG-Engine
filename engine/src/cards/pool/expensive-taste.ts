import { defineCard } from "../define.js";

// Decadent Dragon's Adventure. Outrageous Robbery's shape without its "mana
// of any type" rider: face down, so only the controller may look at them
// (rule 406.3), and "play" lets a land card be played too (its ruling).

export default defineCard({
  name: "Expensive Taste",
  art: "https://cards.scryfall.io/art_crop/back/3/1/315cbbf7-a2ad-4565-9877-1e903d7fd797.jpg",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Exile the top two cards of target opponent's library face down. You may look at and play those cards for as long as they remain exiled. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["opponent"],
  effect: {
    kind: "impulse-exile",
    amount: 2,
    whose: 0,
    duration: "while-exiled",
    faceDown: true,
  },
  faces: ["Decadent Dragon", "Expensive Taste"],
  adventure: true,
});
