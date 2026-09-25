import { defineCard } from "../define.js";

export default defineCard({
  name: "Whisper of the Dross",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -1/-1 until end of turn. Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      { kind: "proliferate" },
    ],
  },
});
