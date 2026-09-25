import { defineCard } from "../define.js";

export default defineCard({
  name: "Pull Under",
  manaCost: "{5}{B}",
  colors: ["B"],
  types: ["instant"],
  subtypes: ["Arcane"],
  text: "Target creature gets -5/-5 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -5, toughness: -5, duration: "end-of-turn" },
});
