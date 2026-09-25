import { defineCard } from "../define.js";

export default defineCard({
  name: "Eyes of the Beholder",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -11/-11 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -11, toughness: -11, duration: "end-of-turn" },
});
