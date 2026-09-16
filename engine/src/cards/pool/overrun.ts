import { defineCard } from "../define.js";

export default defineCard({
  name: "Overrun",
  manaCost: "{2}{G}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Creatures you control get +3/+3 and gain trample until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 3,
        toughness: 3,
        duration: "end-of-turn",
      },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "trample",
        duration: "end-of-turn",
      },
    ],
  },
});
