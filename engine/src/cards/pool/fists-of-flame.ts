import { defineCard } from "../define.js";

// The bonus counts the cards drawn this turn as it resolves, this one's
// included, and stays fixed (rule 611.2c).
export default defineCard({
  name: "Fists of Flame",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Draw a card. Until end of turn, target creature gains trample and gets +1/+0 for each card you've drawn this turn.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 1 },
      { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      {
        kind: "modify-pt",
        target: 0,
        power: { turnStat: "cards-drawn", who: "you" },
        toughness: 0,
        duration: "end-of-turn",
      },
    ],
  },
});
