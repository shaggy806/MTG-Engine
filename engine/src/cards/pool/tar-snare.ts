import { defineCard } from "../define.js";

export default defineCard({
  name: "Tar Snare",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -3/-2 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -3, toughness: -2, duration: "end-of-turn" },
});
