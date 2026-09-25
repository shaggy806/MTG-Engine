import { defineCard } from "../define.js";

export default defineCard({
  name: "Hydrosurge",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target creature gets -5/-0 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -5, toughness: 0, duration: "end-of-turn" },
});
