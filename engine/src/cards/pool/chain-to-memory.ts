import { defineCard } from "../define.js";

export default defineCard({
  name: "Chain to Memory",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target creature gets -4/-0 until end of turn. Scry 2.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -4, toughness: 0, duration: "end-of-turn" },
      { kind: "scry", amount: 2 },
    ],
  },
});
