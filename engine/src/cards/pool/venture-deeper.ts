import { defineCard } from "../define.js";

export default defineCard({
  name: "Venture Deeper",
  art: "https://cards.scryfall.io/art_crop/back/c/e/ceb7308d-608c-4ede-9496-d795fc5bb271.jpg",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Target player mills four cards. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["player"],
  effect: { kind: "mill", target: 0, amount: 4 },
  faces: ["Merfolk Secretkeeper", "Venture Deeper"],
  adventure: true,
});
