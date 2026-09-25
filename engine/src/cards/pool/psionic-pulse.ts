import { defineCard } from "../define.js";

export default defineCard({
  name: "Psionic Pulse",
  art: "https://cards.scryfall.io/art_crop/back/c/0/c0deb9ea-a0d4-4c3f-888e-abd1995cf2b3.jpg",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Counter target noncreature spell. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["noncreature-spell"],
  effect: { kind: "counter", target: 0 },
  faces: ["Sapphire Dragon", "Psionic Pulse"],
  adventure: true,
});
