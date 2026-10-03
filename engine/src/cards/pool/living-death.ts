import { defineCard } from "../define.js";

// Three instructions, each done by every player at once (the ruling): the
// creature cards leave the graveyards together, the creatures are
// sacrificed together, and the exiled cards enter together, each under its
// owner's control. Only the cards the first instruction exiled come back — a
// creature a replacement exiled instead of letting it die (Leyline of the
// Void) doesn't (the ruling).
const TEXT =
  "Each player exiles all creature cards from their graveyard, then sacrifices all creatures they control, then puts all cards they exiled this way onto the battlefield.";

export default defineCard({
  name: "Living Death",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile-graveyard", target: "each-player", filter: { type: "creature" } },
      { kind: "sacrifice-all", who: "each-player", filter: { type: "creature" } },
      { kind: "put-exiled-this-way-onto-battlefield" },
    ],
  },
});
