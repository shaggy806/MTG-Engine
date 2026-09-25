import { defineCard } from "../define.js";

export default defineCard({
  name: "Razaketh's Rite",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  cycling: { cost: "{B}" },
  text: "Search your library for a card, put that card into your hand, then shuffle.\nCycling {B} ({B}, Discard this card: Draw a card.)",
  effect: { kind: "search-library", filter: {}, destination: "hand", min: 0, max: 1 },
});
