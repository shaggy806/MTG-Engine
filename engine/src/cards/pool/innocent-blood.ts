import { defineCard } from "../define.js";

export default defineCard({
  name: "Innocent Blood",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each player sacrifices a creature of their choice.",
  effect: { kind: "sacrifice", who: "each-player", filter: { type: "creature" }, count: 1 },
});
