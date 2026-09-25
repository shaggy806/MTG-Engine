import { defineCard } from "../define.js";

export default defineCard({
  name: "Fatal Fumes",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -4/-2 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -4, toughness: -2, duration: "end-of-turn" },
});
