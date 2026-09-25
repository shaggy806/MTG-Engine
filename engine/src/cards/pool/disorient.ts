import { defineCard } from "../define.js";

export default defineCard({
  name: "Disorient",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target creature gets -7/-0 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -7, toughness: 0, duration: "end-of-turn" },
});
