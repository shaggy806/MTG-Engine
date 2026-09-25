import { defineCard } from "../define.js";

export default defineCard({
  name: "Antagonize",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature gets +4/+3 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 4, toughness: 3, duration: "end-of-turn" },
});
