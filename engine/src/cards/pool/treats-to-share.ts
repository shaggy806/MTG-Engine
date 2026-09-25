import { defineCard } from "../define.js";

export default defineCard({
  name: "Treats to Share",
  art: "https://cards.scryfall.io/art_crop/back/7/f/7f78a570-d776-42f2-a609-6da0156c8de7.jpg",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Create a Food token. (Then exile this card. You may cast the creature later from exile. A Food token is an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
  effect: { kind: "create-token", token: "Food Token", count: 1 },
  faces: ["Curious Pair", "Treats to Share"],
  adventure: true,
});
