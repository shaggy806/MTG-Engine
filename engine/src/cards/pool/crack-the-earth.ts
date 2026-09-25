import { defineCard } from "../define.js";

export default defineCard({
  name: "Crack the Earth",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  subtypes: ["Arcane"],
  text: "Each player sacrifices a permanent of their choice.",
  effect: { kind: "sacrifice", who: "each-player", filter: {}, count: 1 },
});
