import { defineCard } from "../define.js";

export default defineCard({
  name: "That's Mine",
  art: "https://cards.scryfall.io/art_crop/back/f/a/fab7646a-61e8-446b-9dba-ac6e0db82f10.jpg",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Create a Treasure token. (Then exile this card. You may cast the creature later from exile.)",
  effect: { kind: "create-token", token: "Treasure Token", count: 1 },
  faces: ["Grabby Giant", "That's Mine"],
  adventure: true,
});
