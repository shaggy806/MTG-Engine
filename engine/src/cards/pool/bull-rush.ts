import { defineCard } from "../define.js";

export default defineCard({
  name: "Bull Rush",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature gets +2/+0 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
});
