import { defineCard } from "../define.js";

export default defineCard({
  name: "Grasp of Darkness",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -4/-4 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -4, toughness: -4, duration: "end-of-turn" },
});
