import { defineCard } from "../define.js";

export default defineCard({
  name: "Syphon Fuel",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -6/-6 until end of turn. You gain 2 life.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -6, toughness: -6, duration: "end-of-turn" },
      { kind: "gain-life", amount: 2 },
    ],
  },
});
