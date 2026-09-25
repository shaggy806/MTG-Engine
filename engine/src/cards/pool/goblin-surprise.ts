import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Surprise",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Choose one —\n• Creatures you control get +2/+0 until end of turn.\n• Create two 1/1 red Goblin creature tokens.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Creatures you control get +2/+0 until end of turn.",
        effect: {
          kind: "modify-pt-all",
          filter: { type: "creature", controlledBy: "you" },
          power: 2,
          toughness: 0,
          duration: "end-of-turn",
        },
      },
      {
        text: "Create two 1/1 red Goblin creature tokens.",
        effect: { kind: "create-token", token: "Goblin Token", count: 2 },
      },
    ],
  },
});
