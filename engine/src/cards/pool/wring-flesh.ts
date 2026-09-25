import { defineCard } from "../define.js";

export default defineCard({
  name: "Wring Flesh",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -3/-1 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -3, toughness: -1, duration: "end-of-turn" },
});
