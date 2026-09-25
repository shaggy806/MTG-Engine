import { defineCard } from "../define.js";

export default defineCard({
  name: "Rider in Need",
  art: "https://cards.scryfall.io/art_crop/back/9/9/99083707-2152-42c0-b5c3-b4f97ec20190.jpg",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Create a 2/2 white Knight creature token with vigilance. (Then exile this card. You may cast the creature later from exile.)",
  effect: { kind: "create-token", token: "Knight Token", count: 1 },
  faces: ["Lonesome Unicorn", "Rider in Need"],
  adventure: true,
});
