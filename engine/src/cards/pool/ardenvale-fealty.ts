import { defineCard } from "../define.js";

// Virtue of Loyalty's Adventure.

export default defineCard({
  name: "Ardenvale Fealty",
  art: "https://cards.scryfall.io/art_crop/back/e/a/ea7e7daf-7c06-4c74-8bcf-e42c1f611861.jpg",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Create a 2/2 white Knight creature token with vigilance. (Then exile this card. You may cast the enchantment later from exile.)",
  effect: { kind: "create-token", token: "Knight Token", count: 1 },
  faces: ["Virtue of Loyalty", "Ardenvale Fealty"],
  adventure: true,
});
