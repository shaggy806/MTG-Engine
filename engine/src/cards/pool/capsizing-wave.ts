import { defineCard } from "../define.js";


export default defineCard({
  name: "Capsizing Wave",
  art: "https://cards.scryfall.io/art_crop/back/0/b/0bbfb7ae-9a32-428d-903c-99d0d8669b8d.jpg",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Return target creature to its owner's hand. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "return-to-hand", target: 0 },
  faces: ["Sword Coast Serpent", "Capsizing Wave"],
  adventure: true,
});
