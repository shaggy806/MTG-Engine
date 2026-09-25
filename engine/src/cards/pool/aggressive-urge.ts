import { defineCard } from "../define.js";

export default defineCard({
  name: "Aggressive Urge",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gets +1/+1 until end of turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});
