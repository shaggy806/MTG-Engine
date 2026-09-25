import { defineCard } from "../define.js";

export default defineCard({
  name: "Bakery Raid",
  art: "https://cards.scryfall.io/art_crop/back/0/a/0ad345b6-7077-4dd2-b515-c774a3185fe4.jpg",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Create a Food token. (Then exile this card. You may cast the creature later from exile.)",
  effect: { kind: "create-token", token: "Food Token", count: 1 },
  faces: ["Hollow Scavenger", "Bakery Raid"],
  adventure: true,
});
