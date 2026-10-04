import { defineCard } from "../define.js";

// Kellan, Inquisitive Prodigy's Adventure.

export default defineCard({
  name: "Tail the Suspect",
  art: "https://cards.scryfall.io/art_crop/back/c/4/c49690c7-c282-4eb4-8da3-5e0c46a80fc4.jpg",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Investigate. You may play an additional land this turn. (Then exile this card. You may cast the creature later from exile.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Clue Token", count: 1 },
      { kind: "additional-land-drop", amount: 1 },
    ],
  },
  faces: ["Kellan, Inquisitive Prodigy", "Tail the Suspect"],
  adventure: true,
});
