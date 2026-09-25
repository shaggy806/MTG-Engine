import { defineCard } from "../define.js";

export default defineCard({
  name: "Overkill",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -0/-9999 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 0, toughness: -9999, duration: "end-of-turn" },
});
