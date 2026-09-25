import { defineCard } from "../define.js";

export default defineCard({
  name: "Demon's Grasp",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target creature gets -5/-5 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -5, toughness: -5, duration: "end-of-turn" },
});
