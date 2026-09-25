import { defineCard } from "../define.js";

export default defineCard({
  name: "Moment of Craving",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -2/-2 until end of turn. You gain 2 life.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      { kind: "gain-life", amount: 2 },
    ],
  },
});
