import { defineCard } from "../define.js";

export default defineCard({
  name: "Dark Remedy",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets +1/+3 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 1, toughness: 3, duration: "end-of-turn" },
});
