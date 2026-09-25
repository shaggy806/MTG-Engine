import { defineCard } from "../define.js";

export default defineCard({
  name: "Alter Fate",
  art: "https://cards.scryfall.io/art_crop/back/8/4/84c63c27-6095-4fbc-9064-0ef602e1ced8.jpg",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Return target creature card from your graveyard to your hand. (Then exile this card. You may cast the creature later from exile.)",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
  faces: ["Order of Midnight", "Alter Fate"],
  adventure: true,
});
