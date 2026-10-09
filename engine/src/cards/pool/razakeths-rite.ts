import { defineCard } from "../define.js";

export default defineCard({
  name: "Razaketh's Rite",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  cycling: { cost: "{B}" },
  text: "Search your library for a card, put that card into your hand, then shuffle.\nCycling {B} ({B}, Discard this card: Draw a card.)",
  // "A card", no quality: one must be found while there is one (701.23d).
  effect: { kind: "search-library", filter: {}, destination: "hand", min: 1, max: 1 },
});
