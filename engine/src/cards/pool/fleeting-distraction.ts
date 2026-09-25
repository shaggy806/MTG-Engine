import { defineCard } from "../define.js";

export default defineCard({
  name: "Fleeting Distraction",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target creature gets -1/-0 until end of turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -1, toughness: 0, duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});
