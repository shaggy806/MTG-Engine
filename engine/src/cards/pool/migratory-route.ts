import { defineCard } from "../define.js";

export default defineCard({
  name: "Migratory Route",
  manaCost: "{3}{W}{U}",
  colors: ["U", "W"],
  types: ["sorcery"],
  text:
    "Create four 1/1 white Bird creature tokens with flying.\n" +
    "Basic landcycling {2} ({2}, Discard this card: Search your library for a basic land card, reveal it, put it into your hand, then shuffle.)",
  // Basic landcycling — ordinary cycling, but searching instead of drawing.
  cycling: { cost: "{2}", search: { supertype: "basic", type: "land" } },
  effect: { kind: "create-token", token: "Bird Token", count: 4 },
});
