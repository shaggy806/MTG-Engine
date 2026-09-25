import { defineCard } from "../define.js";

export default defineCard({
  name: "Barter in Blood",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each player sacrifices two creatures of their choice.",
  effect: { kind: "sacrifice", who: "each-player", filter: { type: "creature" }, count: 2 },
});
