import { defineCard } from "../define.js";

// "Double its power" is +X/+0, X its power as this resolves (the ruling).
export default defineCard({
  name: "Legion Leadership",
  manaCost: "{1}{R/W}",
  colors: ["R", "W"],
  types: ["instant"],
  text: "Until end of turn, double target creature's power and it gains first strike.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "modify-pt",
        target: 0,
        power: { powerOf: 0, doubling: true },
        toughness: 0,
        duration: "end-of-turn",
      },
      { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
    ],
  },
  faces: ["Legion Leadership", "Legion Stronghold"],
});
