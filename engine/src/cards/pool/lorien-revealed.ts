import { defineCard } from "../define.js";

export default defineCard({
  name: "Lórien Revealed",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "Draw three cards.\n" +
    "Islandcycling {1} ({1}, Discard this card: Search your library for an Island card, reveal it, put it into your hand, then shuffle.)",
  effect: { kind: "draw", amount: 3 },
  cycling: { cost: "{1}", search: { subtype: "Island" } },
});
