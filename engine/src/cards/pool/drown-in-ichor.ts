import { defineCard } from "../define.js";

export default defineCard({
  name: "Drown in Ichor",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target creature gets -4/-4 until end of turn. Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -4, toughness: -4, duration: "end-of-turn" },
      { kind: "proliferate" },
    ],
  },
});
