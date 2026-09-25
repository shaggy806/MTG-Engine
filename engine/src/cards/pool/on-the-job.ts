import { defineCard } from "../define.js";

export default defineCard({
  name: "On the Job",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Creatures you control get +2/+1 until end of turn. Investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 2,
        toughness: 1,
        duration: "end-of-turn",
      },
      { kind: "create-token", token: "Clue Token", count: 1 },
    ],
  },
});
