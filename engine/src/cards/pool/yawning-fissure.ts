import { defineCard } from "../define.js";

export default defineCard({
  name: "Yawning Fissure",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Each opponent sacrifices a land of their choice.",
  effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "land" }, count: 1 },
});
