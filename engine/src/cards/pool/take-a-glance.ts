import { defineCard } from "../define.js";

export default defineCard({
  name: "Take a Glance",
  art: "https://cards.scryfall.io/art_crop/back/6/a/6a109b3e-9f5b-4625-abb7-6b992c10530b.jpg",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Scry 2. (Then exile this card. You may cast the creature later from exile.)",
  effect: { kind: "scry", amount: 2 },
  faces: ["Bilbo Baggins, Burglar", "Take a Glance"],
  adventure: true,
});
