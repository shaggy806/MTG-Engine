import { defineCard } from "../define.js";

export default defineCard({
  name: "Tremble",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Each player sacrifices a land of their choice.",
  effect: { kind: "sacrifice", who: "each-player", filter: { type: "land" }, count: 1 },
});
