import { defineCard } from "../define.js";


export default defineCard({
  name: "Ysgard's Call",
  art: "https://cards.scryfall.io/art_crop/back/b/2/b2419408-e907-4d62-b158-c97afc388c04.jpg",
  manaCost: "{X}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Create X 1/1 white Soldier creature tokens. (Then exile this card. You may cast the artifact later from exile.)",
  effect: { kind: "create-token", token: "Soldier Token", count: "x" },
  faces: ["Horn of Valhalla", "Ysgard's Call"],
  adventure: true,
});
