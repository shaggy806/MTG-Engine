import { defineCard } from "../define.js";

export default defineCard({
  name: "Martial Glory",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  types: ["instant"],
  text: "Target creature gets +3/+0 until end of turn.\nTarget creature gets +0/+3 until end of turn.",
  targets: ["creature", "creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 0, duration: "end-of-turn" },
      { kind: "modify-pt", target: 1, power: 0, toughness: 3, duration: "end-of-turn" },
    ],
  },
});
