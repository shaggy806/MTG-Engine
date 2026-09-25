import { defineCard } from "../define.js";

export default defineCard({
  name: "Blow Off Steam",
  art: "https://cards.scryfall.io/art_crop/back/6/4/64c432d5-4f5b-44ac-9d61-891e78460d58.jpg",
  manaCost: "{R}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Blow Off Steam deals 1 damage to any target. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 1, target: 0 },
  faces: ["Frolicking Familiar", "Blow Off Steam"],
  adventure: true,
});
