import { defineCard } from "../define.js";

export default defineCard({
  name: "Inordinate Rage",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature gets +3/+2 until end of turn. Scry 1.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 2, duration: "end-of-turn" },
      { kind: "scry", amount: 1 },
    ],
  },
});
