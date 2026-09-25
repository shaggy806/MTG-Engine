import { defineCard } from "../define.js";

export default defineCard({
  name: "Take It Back",
  art: "https://cards.scryfall.io/art_crop/back/8/c/8c112f62-6034-4636-a75b-4a45bc916a91.jpg",
  manaCost: "{2}{U}",
  colors: ["B"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Return target spell to its owner's hand. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["spell"],
  effect: { kind: "return-to-hand", target: 0, from: "stack" },
  faces: ["Spellscorn Coven", "Take It Back"],
  adventure: true,
});
