import { defineCard } from "../define.js";

export default defineCard({
  name: "Giant Growth",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gets +3/+3 until end of turn.",
  targets: ["creature"],
  effect: {
    kind: "modify-pt",
    target: 0,
    power: 3,
    toughness: 3,
    duration: "end-of-turn",
  },
});
