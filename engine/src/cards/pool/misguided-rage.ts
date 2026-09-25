import { defineCard } from "../define.js";

export default defineCard({
  name: "Misguided Rage",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Target player sacrifices a permanent of their choice.",
  targets: ["player"],
  effect: { kind: "sacrifice", who: "target", filter: {}, count: 1 },
});
