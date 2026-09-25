import { defineCard } from "../define.js";

export default defineCard({
  name: "Seeds of Strength",
  manaCost: "{G}{W}",
  colors: ["W", "G"],
  types: ["instant"],
  text: "Target creature gets +1/+1 until end of turn.\nTarget creature gets +1/+1 until end of turn.\nTarget creature gets +1/+1 until end of turn.",
  targets: ["creature", "creature", "creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      { kind: "modify-pt", target: 1, power: 1, toughness: 1, duration: "end-of-turn" },
      { kind: "modify-pt", target: 2, power: 1, toughness: 1, duration: "end-of-turn" },
    ],
  },
});
