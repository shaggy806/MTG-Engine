import { defineCard } from "../define.js";

export default defineCard({
  name: "Lash of Malice",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets +2/-2 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 2, toughness: -2, duration: "end-of-turn" },
});
