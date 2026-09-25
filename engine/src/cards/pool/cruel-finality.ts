import { defineCard } from "../define.js";

export default defineCard({
  name: "Cruel Finality",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -2/-2 until end of turn. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      { kind: "scry", amount: 1 },
    ],
  },
});
