import { defineCard } from "../define.js";

// EDHREC rank 2840.
//
// Rulings:
//   [2024-11-08] Preposterous Proportions affects only creatures you control at the time it
//     resolves. It won't affect creatures that come under your control later in the turn.

export default defineCard({
  name: "Preposterous Proportions",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Creatures you control get +10/+10 and gain vigilance until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 10,
        toughness: 10,
        duration: "end-of-turn",
      },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "vigilance",
        duration: "end-of-turn",
      },
    ],
  },
});
