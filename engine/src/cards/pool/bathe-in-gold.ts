import { defineCard } from "../define.js";

export default defineCard({
  name: "Bathe in Gold",
  art: "https://cards.scryfall.io/art_crop/back/d/0/d0b9865a-be87-48fd-a325-be6aca8a31e9.jpg",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Create a Treasure token. (Then exile this card. You may cast the creature later from exile.)",
  effect: { kind: "create-token", token: "Treasure Token", count: 1 },
  faces: ["Young Red Dragon", "Bathe in Gold"],
  adventure: true,
});
