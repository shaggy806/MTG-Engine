import { defineCard } from "../define.js";

export default defineCard({
  name: "Bring Back",
  art: "https://cards.scryfall.io/art_crop/back/8/a/8a665794-513f-4f78-92c9-1844ec27c79c.jpg",
  manaCost: "{G/W}{G/W}{G/W}{G/W}",
  colors: ["W", "G"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Create two 1/1 white Human creature tokens. (Then exile this card. You may cast the creature later from exile.)",
  effect: { kind: "create-token", token: "Human Token", count: 2 },
  faces: ["Oakhame Ranger", "Bring Back"],
  adventure: true,
});
