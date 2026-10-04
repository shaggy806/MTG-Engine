import { defineCard } from "../define.js";

export default defineCard({
  name: "Fungus Frolic",
  art: "https://cards.scryfall.io/art_crop/back/0/e/0e843102-b8cc-4bc8-872e-79924197f4cc.jpg",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Create two 1/1 green Saproling creature tokens. (Then exile this card. You may cast the creature later from exile.)",
  effect: { kind: "create-token", token: "Saproling Token", count: 2 },
  faces: ["Brightcap Badger", "Fungus Frolic"],
  adventure: true,
});
